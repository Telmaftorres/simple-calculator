'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'en_cours',   label: 'En cours',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'termine',    label: 'Terminé',    color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
]

const COND_OPTIONS = [
  { value: 'kit_unitaire', label: 'Kit unitaire' },
  { value: 'caisse',       label: 'En caisse' },
  { value: 'palette',      label: 'Sur palette' },
  { value: 'autre',        label: 'Autre' },
]

export function SectionProductionExtra() {
  const {
    prodStatus, setProdStatus,
    prodRemarques, setProdRemarques,
    prodPlanImageUrl, setProdPlanImageUrl,
    prodNbCollages, setProdNbCollages,
    prodCollagePerPLV, setProdCollagePerPLV,
    prodFaconnageNotes, setProdFaconnageNotes,
    prodConditionnementType, setProdConditionnementType,
    prodConditionnementNotes, setProdConditionnementNotes,
    prodAchatsNotes, setProdAchatsNotes,
  } = useCalculatorContext()

  const [isUploading, setIsUploading] = useState(false)

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'production-sheets')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setProdPlanImageUrl(json.url)
      toast.success('Image téléversée')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du téléversement')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      {/* ── Statut de la fiche ── */}
      <SectionDisplay number="★" title="Statut de la fiche" color="emerald">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setProdStatus(opt.value as 'en_attente' | 'en_cours' | 'termine')}
              className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all ${
                prodStatus === opt.value ? opt.color : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SectionDisplay>

      {/* ── Informations façonnage complémentaires ── */}
      <SectionDisplay number="★" title="Façonnage — infos production" color="slate">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nb collages</Label>
              <Input
                type="number" min={0}
                value={prodNbCollages ?? ''}
                onChange={e => setProdNbCollages(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Mt. collage / PLV (€)</Label>
              <Input
                type="number" min={0} step="0.01"
                value={prodCollagePerPLV ?? ''}
                onChange={e => setProdCollagePerPLV(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes façonnage</Label>
            <Textarea
              value={prodFaconnageNotes ?? ''}
              onChange={e => setProdFaconnageNotes(e.target.value || null)}
              placeholder="Ex : aucun, pliage simple, assemblage kit..."
              rows={2}
            />
          </div>
        </div>
      </SectionDisplay>

      {/* ── Conditionnement infos production ── */}
      <SectionDisplay number="★" title="Conditionnement — infos production" color="slate">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COND_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProdConditionnementType(prodConditionnementType === opt.value ? null : opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  prodConditionnementType === opt.value
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={prodConditionnementNotes ?? ''}
              onChange={e => setProdConditionnementNotes(e.target.value || null)}
              placeholder="Ex : kit unitaire, 5 par caisse..."
              rows={2}
            />
          </div>
        </div>
      </SectionDisplay>

      {/* ── Achats / Accessoires complémentaires ── */}
      <SectionDisplay number="★" title="Achats — notes" color="slate">
        <Textarea
          value={prodAchatsNotes ?? ''}
          onChange={e => setProdAchatsNotes(e.target.value || null)}
          placeholder="Ex : 252 potences magnétiques, 5 grips..."
          rows={3}
        />
      </SectionDisplay>

      {/* ── Remarques générales ── */}
      <SectionDisplay number="★" title="Remarques générales" color="slate">
        <Textarea
          value={prodRemarques ?? ''}
          onChange={e => setProdRemarques(e.target.value || null)}
          placeholder="Observations générales, points d'attention..."
          rows={3}
        />
      </SectionDisplay>

      {/* ── Plan technique ── */}
      <SectionDisplay number="★" title="Plan technique" color="slate">
        {prodPlanImageUrl ? (
          <div className="relative group">
            <img
              src={prodPlanImageUrl}
              alt="Plan technique"
              className="rounded-md border border-slate-200 max-h-64 w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setProdPlanImageUrl(null)}
              className="absolute top-2 right-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
            >
              <X className="h-3.5 w-3.5 text-slate-500 hover:text-red-500" />
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${isUploading ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}>
            {isUploading
              ? <Upload className="h-6 w-6 text-emerald-500 animate-bounce" />
              : <ImageIcon className="h-6 w-6 text-slate-400" />}
            <span className="text-sm text-slate-500">{isUploading ? 'Téléversement…' : 'Cliquer pour ajouter le plan technique'}</span>
            <span className="text-xs text-slate-400">JPEG, PNG, WEBP — max 5 Mo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleUploadImage}
              disabled={isUploading}
            />
          </label>
        )}
      </SectionDisplay>
    </>
  )
}
