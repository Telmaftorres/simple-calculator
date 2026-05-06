'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { Upload, X, ImageIcon, SlidersHorizontal, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { AmalgameCustomizeDialog } from './AmalgameCustomizeDialog'

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'en_cours',   label: 'En cours',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'termine',    label: 'Terminé',    color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
]

export function SectionProductionExtra() {
  const {
    prodStatus, setProdStatus,
    prodRemarques, setProdRemarques,
    prodPlanImageUrl, setProdPlanImageUrl,
    prodNbCollages, setProdNbCollages,
    prodCollagePerPLV, setProdCollagePerPLV,
    prodFaconnageNotes, setProdFaconnageNotes,
    amalgameGroups, amalgameGroupResults,
    products, updateProduct,
  } = useCalculatorContext()

  const [isUploading, setIsUploading] = useState(false)
  const [customizingGroupId, setCustomizingGroupId] = useState<string | null>(null)

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
      {/* ── Disposition des amalgames ── */}
      {amalgameGroups.length > 0 && (
        <SectionDisplay number="★" title="Disposition des amalgames" color="violet">
          <div className="space-y-3">
            {amalgameGroups.map(group => {
              const result = amalgameGroupResults.find(r => r.groupId === group.id) ?? null
              const slotsWithIndices = products
                .map((p, i) => ({ slot: p, index: i }))
                .filter(({ slot }) => slot.amalgameGroupId === group.id)
              const slotsInGroup = slotsWithIndices.map(x => x.slot)
              const isCustom = slotsInGroup.length > 0 && slotsInGroup.every(s => s.countPerPlateInGroup > 0)
              const platesCount = result?.platesCount ?? 0

              return (
                <div key={group.id} className="border border-violet-100 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-violet-50">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-sm font-semibold text-slate-700">{group.name}</span>
                      {platesCount > 0 && (
                        <span className="text-xs text-violet-500">{platesCount} plaque{platesCount > 1 ? 's' : ''}</span>
                      )}
                      {isCustom && (
                        <span className="text-xs px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded font-medium">Personnalisé</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomizingGroupId(group.id)}
                      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-900 px-2 py-1 rounded hover:bg-violet-100 transition-colors font-medium"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      {isCustom ? 'Modifier' : 'Personnaliser'}
                    </button>
                  </div>

                  <div className="px-3 py-2 space-y-1.5 bg-white">
                    {slotsInGroup.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Aucun produit assigné</span>
                    ) : slotsInGroup.map(s => {
                      const count = isCustom ? s.countPerPlateInGroup : result?.multiImposition?.strips.find(st => st.productName === (s.productSearch || s.id))?.posesPerPlate
                      return (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{s.productSearch || '—'}</span>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span>{s.flatWidth}×{s.flatHeight} mm — qté {s.quantity}</span>
                            {count !== undefined && (
                              <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {count} pose{count > 1 ? 's' : ''}/pl.
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dialog personnalisation */}
          {customizingGroupId && (() => {
            const group = amalgameGroups.find(g => g.id === customizingGroupId)
            if (!group) return null
            const result = amalgameGroupResults.find(r => r.groupId === customizingGroupId) ?? null
            const slotsWithIndices = products
              .map((p, i) => ({ slot: p, index: i }))
              .filter(({ slot }) => slot.amalgameGroupId === customizingGroupId)
            return (
              <AmalgameCustomizeDialog
                open
                onClose={() => setCustomizingGroupId(null)}
                group={group}
                groupResult={result}
                slotsInGroup={slotsWithIndices.map(x => x.slot)}
                slotIndices={slotsWithIndices.map(x => x.index)}
                onUpdateCountPerPlate={(idx, count) => updateProduct(idx, 'countPerPlateInGroup', count)}
              />
            )
          })()}
        </SectionDisplay>
      )}

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

      {/* ── Façonnage infos production ── */}
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
