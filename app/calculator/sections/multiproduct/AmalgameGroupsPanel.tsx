'use client'

import { useState } from 'react'
import { Plus, Layers, X, TrendingDown, TrendingUp, SlidersHorizontal } from 'lucide-react'
import { useCalculatorContext } from '../../context/CalculatorContext'
import { GroupEditor } from './GroupEditor'
import { AmalgameCustomizeDialog } from '../AmalgameCustomizeDialog'
import type { AmalgameGroup } from '@/types/calculator'
import { GROUP_COLORS } from '@/types/calculator'

function groupColor(group: AmalgameGroup | undefined) {
  if (!group) return null
  return GROUP_COLORS[group.colorIndex % GROUP_COLORS.length]
}

export function AmalgameGroupsPanel() {
  const {
    amalgameGroups, setAmalgameGroups,
    amalgameGroupResults,
    products, updateProduct,
  } = useCalculatorContext()

  const [showNewForm, setShowNewForm] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [customizingGroupId, setCustomizingGroupId] = useState<string | null>(null)

  const applyGroupProductAssignment = (group: AmalgameGroup, productIds: string[]) => {
    products.forEach((p, i) => {
      const shouldBeInGroup = productIds.includes(p.id)
      const isCurrentlyInThisGroup = p.amalgameGroupId === group.id
      if (shouldBeInGroup && !isCurrentlyInThisGroup) updateProduct(i, 'amalgameGroupId', group.id)
      else if (!shouldBeInGroup && isCurrentlyInThisGroup) updateProduct(i, 'amalgameGroupId', null)
    })
  }

  const handleSaveNew = (group: AmalgameGroup, productIds: string[]) => {
    setAmalgameGroups([...amalgameGroups, group])
    setTimeout(() => applyGroupProductAssignment(group, productIds), 0)
    setShowNewForm(false)
  }

  const handleSaveEdit = (group: AmalgameGroup, productIds: string[]) => {
    setAmalgameGroups(amalgameGroups.map(g => g.id === group.id ? group : g))
    applyGroupProductAssignment(group, productIds)
    setEditingGroupId(null)
  }

  const removeGroup = (id: string) => {
    setAmalgameGroups(amalgameGroups.filter(g => g.id !== id))
    products.forEach((p, i) => {
      if (p.amalgameGroupId === id) updateProduct(i, 'amalgameGroupId', null)
    })
  }

  if (amalgameGroups.length === 0 && !showNewForm) {
    return (
      <div className="pt-2">
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 text-sm font-semibold transition-all w-full justify-center"
        >
          <Layers className="h-4 w-4" /> Amalgamer des produits
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" /> Amalgames
        </span>
        {!showNewForm && !editingGroupId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-3 w-3" /> Nouvel amalgame
          </button>
        )}
      </div>

      {/* Groupes existants */}
      {amalgameGroups.map(group => {
        const c = groupColor(group)
        const result = amalgameGroupResults.find(r => r.groupId === group.id)
        const slotsInGroup = products.filter(p => p.amalgameGroupId === group.id)
        const isEditing = editingGroupId === group.id

        if (isEditing) {
          return (
            <GroupEditor key={group.id} initial={group} products={products}
              onSave={handleSaveEdit} onCancel={() => setEditingGroupId(null)} />
          )
        }

        const isCustom = slotsInGroup.length > 0 && slotsInGroup.every(s => s.countPerPlateInGroup > 0)

        return (
          <div key={group.id} className={`rounded-xl border overflow-hidden ${group.amalgameType === 'impression_decoupe' ? 'border-violet-200' : 'border-orange-200'}`}>

            {/* En-tête */}
            <div className={`px-4 py-2.5 flex items-center justify-between ${group.amalgameType === 'impression_decoupe' ? 'bg-violet-50' : 'bg-orange-50'}`}>
              <div className="flex items-center gap-2">
                {c && <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />}
                <span className="font-semibold text-sm text-slate-800">{group.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.amalgameType === 'impression_decoupe' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                  {group.amalgameType === 'impression_decoupe' ? 'Impression + Découpe' : 'Découpe uniquement'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setShowNewForm(false); setCustomizingGroupId(group.id) }}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-900 px-2 py-1 rounded hover:bg-white transition-colors font-medium"
                >
                  <SlidersHorizontal className="h-3 w-3" /> Personnaliser
                </button>
                <button
                  onClick={() => { setShowNewForm(false); setEditingGroupId(group.id) }}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-white transition-colors"
                >
                  Modifier
                </button>
                <button onClick={() => removeGroup(group.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Produits */}
            <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
              {slotsInGroup.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Aucun produit assigné</span>
              ) : (
                slotsInGroup.map(p => (
                  <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c?.badge}`}>
                    {p.productSearch || '—'}
                  </span>
                ))
              )}
            </div>

            {/* Indicateur layout custom ou imposition auto */}
            {(() => {
              if (isCustom) {
                const customPlates = Math.max(...slotsInGroup.map(s => Math.ceil(s.quantity / s.countPerPlateInGroup)))
                return (
                  <div className="px-4 py-2 border-t bg-sky-50/60 border-sky-100 text-xs flex items-center justify-between gap-3 text-sky-700">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SlidersHorizontal className="h-3 w-3 flex-shrink-0" />
                      {slotsInGroup.map((s, i) => (
                        <span key={s.id}>
                          {i > 0 && <span className="opacity-50 mx-0.5">+</span>}
                          <strong>{s.countPerPlateInGroup}×</strong> {s.productSearch || `P${i + 1}`}
                        </span>
                      ))}
                      <span className="opacity-60">/ plaque</span>
                      <span className="text-sky-400 font-normal italic">(personnalisé)</span>
                    </div>
                    <span className="font-semibold whitespace-nowrap">{customPlates} pl.</span>
                  </div>
                )
              }
              if (result?.multiImposition?.feasible) {
                return (
                  <div className={`px-4 py-2 border-t text-xs flex items-center justify-between gap-3 ${result.multiImposition.isBetterThanSeparate ? 'bg-emerald-50/60 border-emerald-100 text-emerald-700' : 'bg-amber-50/60 border-amber-100 text-amber-700'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {result.multiImposition.isBetterThanSeparate
                        ? <TrendingDown className="h-3 w-3 flex-shrink-0" />
                        : <TrendingUp className="h-3 w-3 flex-shrink-0" />}
                      {result.multiImposition.strips.map((s, i) => (
                        <span key={i}>
                          {i > 0 && <span className="opacity-50 mx-0.5">+</span>}
                          <strong>{s.posesPerPlate}×</strong> {s.productName || `P${s.productIndex + 1}`}
                        </span>
                      ))}
                      <span className="opacity-60">/ plaque</span>
                    </div>
                    <span className="font-semibold whitespace-nowrap">
                      {result.multiImposition.savingsPercent > 0 ? `−${result.multiImposition.savingsPercent}%` : `+${Math.abs(result.multiImposition.savingsPercent)}%`}
                    </span>
                  </div>
                )
              }
              return null
            })()}

            {/* Sous-total */}
            {result && result.totalCost > 0 && (
              <div className={`flex items-center justify-between px-4 py-2.5 border-t text-sm ${group.amalgameType === 'impression_decoupe' ? 'bg-violet-50/50 border-violet-100' : 'bg-orange-50/50 border-orange-100'}`}>
                <span className="text-slate-500 text-xs flex items-center gap-2 flex-wrap">
                  {result.platesCount > 0 && <span>{result.platesCount} plaque{result.platesCount > 1 ? 's' : ''}</span>}
                  {group.amalgameType === 'impression_decoupe' && result.machineTimeMin > 0 && (
                    <span>{Math.round(result.machineTimeMin)} min impression</span>
                  )}
                  {result.cuttingMachineTimeMin > 0 && (
                    <span>{Math.round(result.cuttingMachineTimeMin)} min découpe</span>
                  )}
                </span>
                <span className="font-bold text-slate-800">{result.totalCost.toFixed(2)} €</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Formulaire nouvel amalgame */}
      {showNewForm && (
        <GroupEditor products={products} onSave={handleSaveNew} onCancel={() => setShowNewForm(false)} />
      )}

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
    </div>
  )
}
