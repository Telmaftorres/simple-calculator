'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, X, Search } from 'lucide-react'
import { saveProductLinesPlate, saveProductElementsPlate } from '@/app/actions/production-products'
import { getPlates } from '@/app/actions/reference-data'
import { createPlate } from '@/app/actions/catalog'
import type { Quote } from './quote-detail-shared'

type Plate = { id: number; name: string; width: number; height: number; cost: number; material: string }

function getQuotePlate(quote: Quote, lineName: string): Plate | null {
  if (quote.isMultiProduct && quote.products.length > 0) {
    const match = quote.products.find(p =>
      (p.productTypeName ?? '').toLowerCase() === lineName.toLowerCase()
    ) ?? quote.products[0]
    return (match?.plate as Plate | null) ?? null
  }
  if (quote.amalgameRuns.length > 0) {
    const run = quote.amalgameRuns.find(r => r.name.toLowerCase() === lineName.toLowerCase())
      ?? quote.amalgameRuns[0]
    return (run?.plate as Plate | null) ?? null
  }
  return (quote.plate as Plate | null) ?? null
}

// ── Sélecteur avec recherche + création inline ──
function PlateSelector({
  plates,
  value,
  onChange,
  onPlateCreated,
}: {
  plates: Plate[]
  value: number | null
  onChange: (plateId: number | null) => void
  onPlateCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', width: '', height: '', cost: '', material: '' })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const computePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setDropdownStyle({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width })
  }, [])

  useEffect(() => {
    if (!open) return
    computePos()
    setTimeout(() => searchRef.current?.focus(), 0)
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !dropRef.current?.contains(t)) {
        setOpen(false)
        setShowCreate(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', computePos, true)
    window.addEventListener('resize', computePos)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', computePos, true)
      window.removeEventListener('resize', computePos)
    }
  }, [open, computePos])

  const selected = plates.find(p => p.id === value) ?? null

  const filtered = search.trim()
    ? plates.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.material.toLowerCase().includes(search.toLowerCase())
      )
    : plates

  const handleCreate = async () => {
    if (!form.name || !form.width || !form.height || !form.cost || !form.material) {
      toast.error('Remplissez tous les champs')
      return
    }
    setCreating(true)
    try {
      await createPlate({
        name: form.name.trim(),
        width: parseInt(form.width),
        height: parseInt(form.height),
        cost: parseFloat(form.cost),
        material: form.material.trim(),
      })
      toast.success('Plaque créée')
      setShowCreate(false)
      setForm({ name: '', width: '', height: '', cost: '', material: '' })
      setOpen(false)
      setSearch('')
      onPlateCreated()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur création')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative w-full">
      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpen(v => !v); setShowCreate(false) }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors text-left"
      >
        <span className="flex-1 min-w-0 truncate">
          {selected
            ? <>{selected.name} <span className="text-slate-400 text-xs">({selected.material} · {selected.width}×{selected.height})</span></>
            : <span className="text-slate-400">— choisir une plaque</span>
          }
        </span>
        {selected && (
          <span
            onClick={e => { e.stopPropagation(); onChange(null) }}
            className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl"
        >
          {!showCreate ? (
            <>
              {/* Recherche */}
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher une plaque…"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Liste filtrée */}
              <div className="max-h-52 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-2">Aucun résultat.</p>
                ) : (
                  filtered.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onChange(p.id); setOpen(false); setSearch('') }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-left transition-colors ${value === p.id ? 'bg-slate-50 font-semibold' : ''}`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{p.material} · {p.width}×{p.height}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Créer */}
              <div className="border-t border-slate-100 p-1">
                <button
                  onClick={() => { setShowCreate(true); setSearch('') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Créer une nouvelle plaque
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700 mb-1">Nouvelle plaque</p>
              <input
                type="text"
                placeholder="Nom"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Largeur mm" value={form.width}
                  onChange={e => setForm(f => ({ ...f, width: e.target.value }))}
                  className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
                <input type="number" placeholder="Hauteur mm" value={form.height}
                  onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                  className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.01" placeholder="Coût €" value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
                <input type="text" placeholder="Matière (ex: BC)" value={form.material}
                  onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                  className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors">
                  Annuler
                </button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex-1 py-1.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
                  {creating ? 'Création…' : 'Créer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MatiereBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const dbLines = ps?.productionProductLines ?? []

  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plates, setPlates] = useState<Plate[]>([])
  const [loadingPlates, setLoadingPlates] = useState(true)

  // lineId → plateId
  const [lineSelections, setLineSelections] = useState<Record<number, number | null>>(() => {
    const map: Record<number, number | null> = {}
    for (const l of dbLines) {
      map[l.id] = l.plate?.id ?? getQuotePlate(quote, l.name)?.id ?? null
    }
    return map
  })

  // elementId → plateId — hérite de la sélection de la ligne parent par défaut
  const [elemSelections, setElemSelections] = useState<Record<number, number | null>>(() => {
    const map: Record<number, number | null> = {}
    for (const l of dbLines) {
      const fallback = l.plate?.id ?? getQuotePlate(quote, l.name)?.id ?? null
      for (const el of l.elements) {
        map[el.id] = el.plate?.id ?? fallback
      }
    }
    return map
  })

  useEffect(() => {
    getPlates().then(data => { setPlates(data); setLoadingPlates(false) })
  }, [])

  const refreshPlates = () => getPlates().then(setPlates)

  const hasLines = dbLines.length > 0

  // Quand on change la plaque d'une ligne, propager aux éléments sans plaque explicite
  const handleLineChange = (lineId: number, plateId: number | null) => {
    setLineSelections(prev => ({ ...prev, [lineId]: plateId }))
    const line = dbLines.find(l => l.id === lineId)
    if (!line) return
    setElemSelections(prev => {
      const next = { ...prev }
      for (const el of line.elements) {
        if (!el.plate) next[el.id] = plateId
      }
      return next
    })
  }

  const summary = hasLines
    ? dbLines.map(l => {
        const p = plates.find(pl => pl.id === lineSelections[l.id])
        return p ? `${l.name} : ${p.name}` : null
      }).filter(Boolean).join(' · ') || `${dbLines.length} produit${dbLines.length > 1 ? 's' : ''}`
    : ''

  const handleSave = async () => {
    if (!hasLines || !ps) return
    setSaving(true)
    try {
      const allElements = dbLines.flatMap(l => l.elements)
      await Promise.all([
        saveProductLinesPlate(
          dbLines.map(l => ({ lineId: l.id, plateId: lineSelections[l.id] ?? null })),
          quote.id
        ),
        allElements.length > 0
          ? saveProductElementsPlate(
              allElements.map(el => ({ elementId: el.id, plateId: elemSelections[el.id] ?? null })),
              quote.id
            )
          : Promise.resolve(),
      ])
      toast.success('Matières enregistrées')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-2xl border transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'} bg-white overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl leading-none">🧱</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Matière(s)</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
          {!hasLines ? (
            <p className="text-xs text-slate-400 py-1">
              Enregistrez d&apos;abord les produits dans la section Produit(s).
            </p>
          ) : loadingPlates ? (
            <p className="text-xs text-slate-400 py-1">Chargement des plaques…</p>
          ) : (
            <>
              <div className="space-y-3">
                {dbLines.map(line => (
                  <div key={line.id} className="border border-slate-100 rounded-xl overflow-visible">
                    {/* En-tête produit */}
                    <div className={`px-3 py-2 bg-slate-50 ${line.elements.length > 0 ? 'rounded-t-xl' : 'rounded-xl'}`}>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{line.name}</p>
                    </div>

                    {/* Pas d'éléments : sélecteur sur le produit lui-même */}
                    {line.elements.length === 0 && (
                      <div className="px-3 py-2">
                        <PlateSelector
                          plates={plates}
                          value={lineSelections[line.id] ?? null}
                          onChange={plateId => handleLineChange(line.id, plateId)}
                          onPlateCreated={refreshPlates}
                        />
                      </div>
                    )}

                    {/* Éléments : un sélecteur par élément */}
                    {line.elements.length > 0 && (
                      <div className="divide-y divide-slate-100">
                        {line.elements.map(el => (
                          <div key={el.id} className="flex flex-col gap-1 px-3 py-2">
                            <p className="text-xs text-slate-500 truncate">{el.name}</p>
                            <PlateSelector
                              plates={plates}
                              value={elemSelections[el.id] ?? null}
                              onChange={plateId => setElemSelections(prev => ({ ...prev, [el.id]: plateId }))}
                              onPlateCreated={refreshPlates}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
                  {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
