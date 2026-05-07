'use client'

import { useState, useRef } from 'react'
import { read, utils } from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { TransportDeliveryForm } from '@/types/calculator'
import { suggestTransportMode, type TransportMode } from '@/lib/transport/geodis-rates'

type TransportMode3 = 'PACK30' | 'MESSAGERIE_PLUS' | 'AFFRETEMENT'

interface ParsedRow {
  department: string
  weightKg: number | undefined
  units: number
  rawCp: string
}

function extractDepartment(cp: unknown): string {
  const s = String(cp ?? '').trim().replace(/\s/g, '')
  if (!s) return ''
  // Codes Corse : 2A / 2B
  if (/^2[ab]/i.test(s)) return s.substring(0, 2).toUpperCase()
  // DOM : 971–976
  if (/^97\d/.test(s)) return s.substring(0, 3)
  // Standard : 2 premiers chiffres
  const dept = s.substring(0, 2).replace(/\D/g, '')
  return dept.length === 2 ? dept : ''
}

export function ImportTransportDialog({
  onClose,
  onImport,
  existingCount,
}: {
  onClose: () => void
  onImport: (deliveries: TransportDeliveryForm[], replace: boolean) => void
  existingCount: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [fileName, setFileName] = useState('')
  const [colCp, setColCp] = useState('')
  const [colColis, setColColis] = useState('')
  const [colPoids, setColPoids] = useState('')
  const [defaultMode, setDefaultMode] = useState<TransportMode3>('PACK30')
  const [defaultWeight, setDefaultWeight] = useState<number>(5)
  const [defaultUnits, setDefaultUnits] = useState<number>(1)
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [error, setError] = useState('')

  const handleFile = (file: File) => {
    setError('')
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
        if (json.length === 0) { setError('Le fichier est vide.'); return }
        const hdrs = Object.keys(json[0])
        setHeaders(hdrs)
        setRows(json)
        // Auto-detect "cp" column (exact match case-insensitive)
        const cpCol = hdrs.find(h => h.trim().toLowerCase() === 'cp') ?? ''
        setColCp(cpCol)
        // Auto-detect colis / poids
        const colisCol = hdrs.find(h => /^(nb.?colis|colis|col|qte|quantit|nbr|unités|unites|palettes?)$/i.test(h.trim())) ?? ''
        setColColis(colisCol)
        const poidsCol = hdrs.find(h => /^(poids|kg|weight|masse)$/i.test(h.trim())) ?? ''
        setColPoids(poidsCol)
      } catch {
        setError('Impossible de lire le fichier. Vérifiez qu\'il s\'agit bien d\'un Excel ou CSV.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const parsed: ParsedRow[] = rows
    .map(row => {
      const rawCp = String(row[colCp] ?? '').trim()
      const dept = extractDepartment(rawCp)
      const units = colColis ? (parseInt(String(row[colColis] ?? '')) || defaultUnits) : defaultUnits
      const weightKg = colPoids ? (parseFloat(String(row[colPoids] ?? '')) || undefined) : defaultWeight
      return { department: dept, weightKg, units, rawCp }
    })
    .filter(r => r.department !== '')

  const autoMode = (row: ParsedRow): TransportMode3 => {
    if (defaultMode !== 'PACK30') return defaultMode
    const suggested = suggestTransportMode(row.weightKg ?? defaultWeight, row.units)
    return (suggested as TransportMode3) ?? defaultMode
  }

  const handleImport = () => {
    if (!colCp) { setError('Sélectionnez la colonne code postal.'); return }
    if (parsed.length === 0) { setError('Aucune ligne valide à importer.'); return }
    const deliveries: TransportDeliveryForm[] = parsed.map(row => ({
      id: uuidv4(),
      mode: autoMode(row),
      department: row.department,
      weightKg: row.weightKg ?? defaultWeight,
      units: row.units,
      optionsHT: 0,
    }))
    onImport(deliveries, replaceExisting)
    onClose()
  }

  const preview = parsed.slice(0, 8)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-sky-600" />
            <h2 className="font-bold text-slate-800">Importer des points de livraison</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Zone de dépôt / sélection */}
          {rows.length === 0 ? (
            <div
              className="border-2 border-dashed border-sky-200 rounded-xl p-8 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/40 transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <Upload className="h-8 w-8 text-sky-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Glissez un fichier Excel ou CSV ici</p>
              <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
              <p className="text-xs text-slate-300 mt-3">.xlsx · .xls · .csv</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-sky-600 flex-shrink-0" />
              <span className="font-medium text-sky-800 truncate">{fileName}</span>
              <span className="text-sky-500 whitespace-nowrap">— {rows.length} ligne(s)</span>
              <button
                className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
                onClick={() => { setRows([]); setHeaders([]); setFileName(''); setColCp(''); setColColis(''); setColPoids('') }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {rows.length > 0 && (
            <>
              {/* Mapping colonnes */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold">Correspondance des colonnes</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Code postal *</Label>
                    <select
                      value={colCp}
                      onChange={e => setColCp(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      <option value="">— choisir —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Nb colis</Label>
                    <select
                      value={colColis}
                      onChange={e => setColColis(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      <option value="">Valeur par défaut</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Poids (kg)</Label>
                    <select
                      value={colPoids}
                      onChange={e => setColPoids(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      <option value="">Valeur par défaut</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Valeurs par défaut */}
              <div className="space-y-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Valeurs par défaut</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Mode</Label>
                    <select
                      value={defaultMode}
                      onChange={e => setDefaultMode(e.target.value as TransportMode3)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      <option value="PACK30">Pack 30</option>
                      <option value="MESSAGERIE_PLUS">Messagerie Plus</option>
                      <option value="AFFRETEMENT">Affrètement</option>
                    </select>
                  </div>
                  {!colPoids && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Poids défaut (kg)</Label>
                      <input
                        type="number" min={0} step={0.5}
                        value={defaultWeight}
                        onChange={e => setDefaultWeight(parseFloat(e.target.value) || 0)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      />
                    </div>
                  )}
                  {!colColis && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Nb colis défaut</Label>
                      <input
                        type="number" min={1}
                        value={defaultUnits}
                        onChange={e => setDefaultUnits(parseInt(e.target.value) || 1)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Aperçu */}
              {colCp && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 font-semibold">Aperçu</Label>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {parsed.length} point(s) valides sur {rows.length} ligne(s)
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                        <tr>
                          <th className="px-3 py-2 text-left">CP</th>
                          <th className="px-3 py-2 text-left">Dépt</th>
                          <th className="px-3 py-2 text-left">Colis</th>
                          <th className="px-3 py-2 text-left">Poids</th>
                          <th className="px-3 py-2 text-left">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 text-slate-600">{r.rawCp}</td>
                            <td className="px-3 py-1.5 font-semibold text-sky-700">{r.department || <span className="text-red-400">⚠ invalide</span>}</td>
                            <td className="px-3 py-1.5">{r.units}</td>
                            <td className="px-3 py-1.5">{r.weightKg != null ? `${r.weightKg} kg` : `${defaultWeight} kg`}</td>
                            <td className="px-3 py-1.5 text-slate-500">{autoMode(r) === 'PACK30' ? 'Pack 30' : autoMode(r) === 'MESSAGERIE_PLUS' ? 'Messagerie+' : 'Affrèt.'}</td>
                          </tr>
                        ))}
                        {parsed.length > 8 && (
                          <tr className="border-t border-slate-100 bg-slate-50">
                            <td colSpan={5} className="px-3 py-1.5 text-center text-slate-400 italic">
                              + {parsed.length - 8} autre(s) point(s)…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Remplacement ou ajout */}
              {existingCount > 0 && (
                <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <button
                    onClick={() => setReplaceExisting(true)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${replaceExisting ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-amber-100'}`}
                  >
                    Remplacer les {existingCount} point(s) existants
                  </button>
                  <button
                    onClick={() => setReplaceExisting(false)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${!replaceExisting ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-sky-100'}`}
                  >
                    Ajouter aux existants
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button
            size="sm"
            disabled={!colCp || parsed.length === 0}
            onClick={handleImport}
            className="bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Importer {parsed.length > 0 ? `${parsed.length} point(s)` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
