'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { Layers, SlidersHorizontal } from 'lucide-react'
import { AmalgameCustomizeDialog } from './AmalgameCustomizeDialog'

export function SectionActualsExtra() {
  const {
    actualsNotes, setActualsNotes,
    amalgameGroups, amalgameGroupResults,
    products, updateProduct,
  } = useCalculatorContext()

  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null)

  return (
    <>
      {/* ── Disposition des amalgames (données réelles) ── */}
      {amalgameGroups.length > 0 && (
        <SectionDisplay number="★" title="Disposition des amalgames" color="sky">
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
                <div key={group.id} className="border border-sky-100 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-sky-50">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-sky-500" />
                      <span className="text-sm font-semibold text-slate-700">{group.name}</span>
                      {platesCount > 0 && (
                        <span className="text-xs text-sky-500">{platesCount} plaque{platesCount > 1 ? 's' : ''}</span>
                      )}
                      {isCustom && (
                        <span className="text-xs px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded font-medium">Personnalisé</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingGroupId(group.id)}
                      className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-900 px-2 py-1 rounded hover:bg-sky-100 transition-colors font-medium"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      Voir détail
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

          {/* Dialog lecture seule */}
          {viewingGroupId && (() => {
            const group = amalgameGroups.find(g => g.id === viewingGroupId)
            if (!group) return null
            const result = amalgameGroupResults.find(r => r.groupId === viewingGroupId) ?? null
            const slotsWithIndices = products
              .map((p, i) => ({ slot: p, index: i }))
              .filter(({ slot }) => slot.amalgameGroupId === viewingGroupId)
            return (
              <AmalgameCustomizeDialog
                open
                onClose={() => setViewingGroupId(null)}
                group={group}
                groupResult={result}
                slotsInGroup={slotsWithIndices.map(x => x.slot)}
                slotIndices={slotsWithIndices.map(x => x.index)}
                onUpdateCountPerPlate={(idx, count) => updateProduct(idx, 'countPerPlateInGroup', count)}
                readOnly
              />
            )
          })()}
        </SectionDisplay>
      )}

      {/* ── Observations ── */}
      <SectionDisplay number="★" title="Observations — données réelles" color="sky">
        <Textarea
          value={actualsNotes ?? ''}
          onChange={e => setActualsNotes(e.target.value || null)}
          placeholder="Difficultés rencontrées, écarts constatés, points d'amélioration..."
          rows={4}
        />
      </SectionDisplay>
    </>
  )
}
