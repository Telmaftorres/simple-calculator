'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RotateCcw, Layers } from 'lucide-react'
import type { AmalgameGroup, AmalgameGroupResult, ProductSlot } from '@/types/calculator'

interface Props {
  open: boolean
  onClose: () => void
  group: AmalgameGroup
  groupResult: AmalgameGroupResult | null
  slotsInGroup: ProductSlot[]
  slotIndices: number[]
  onUpdateCountPerPlate: (slotIndex: number, count: number) => void
  readOnly?: boolean
}

export function AmalgameCustomizeDialog({
  open, onClose, group, groupResult, slotsInGroup, slotIndices, onUpdateCountPerPlate, readOnly = false,
}: Props) {
  const [customCounts, setCustomCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    slotsInGroup.forEach(s => { init[s.id] = s.countPerPlateInGroup > 0 ? s.countPerPlateInGroup : 0 })
    return init
  })

  const autoResult = groupResult?.multiImposition
  const isCustomMode = slotsInGroup.every(s => (customCounts[s.id] ?? 0) > 0)
  const previewPlates = isCustomMode
    ? Math.max(...slotsInGroup.map(s => Math.ceil(s.quantity / (customCounts[s.id] ?? 1))))
    : null

  const handleSave = () => {
    slotsInGroup.forEach((s, i) => {
      onUpdateCountPerPlate(slotIndices[i], customCounts[s.id] ?? 0)
    })
    onClose()
  }

  const handleReset = () => {
    const reset: Record<string, number> = {}
    slotsInGroup.forEach(s => { reset[s.id] = 0 })
    setCustomCounts(reset)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {readOnly ? 'Disposition — ' : 'Personnaliser — '}{group.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Suggestion automatique */}
          {autoResult?.feasible && (
            <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 text-sm space-y-1">
              <div className="font-semibold text-violet-700 mb-1">Suggestion automatique</div>
              {autoResult.strips.map((strip, i) => (
                <div key={i} className="flex items-center justify-between text-violet-600">
                  <span>{strip.productName}</span>
                  <span className="font-semibold">
                    {strip.cols}×{strip.rows} = {strip.posesPerPlate} pose{strip.posesPerPlate > 1 ? 's' : ''}/plaque
                    {strip.rotated && ' ↻'}
                  </span>
                </div>
              ))}
              <div className="text-violet-700 font-bold pt-1 border-t border-violet-100">
                {autoResult.platesNeeded} plaque{autoResult.platesNeeded > 1 ? 's' : ''} au total
              </div>
            </div>
          )}

          {/* Saisie personnalisée */}
          <div className="space-y-4">
            {slotsInGroup.map(s => {
              const autoStrip = autoResult?.strips.find(st => st.productName === (s.productSearch || s.id))
              const autoCount = autoStrip?.posesPerPlate ?? null
              const currentCount = customCounts[s.id] ?? 0

              return (
                <div key={s.id} className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    {s.productSearch || 'Produit'}
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      {s.flatWidth}×{s.flatHeight} mm — qté {s.quantity}
                    </span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min={1} step={1}
                      value={currentCount || ''}
                      onChange={e => setCustomCounts(prev => ({ ...prev, [s.id]: parseInt(e.target.value) || 0 }))}
                      placeholder={autoCount ? `Auto : ${autoCount}` : 'Poses / plaque'}
                      className="w-40"
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                    <span className="text-xs text-slate-400">poses / plaque</span>
                    {!readOnly && autoCount && currentCount !== autoCount && (
                      <button
                        type="button"
                        onClick={() => setCustomCounts(prev => ({ ...prev, [s.id]: autoCount }))}
                        className="text-xs text-violet-600 hover:text-violet-800 underline"
                      >
                        Utiliser auto ({autoCount})
                      </button>
                    )}
                  </div>
                  {currentCount > 0 && (
                    <p className="text-xs text-slate-400">
                      → {Math.ceil(s.quantity / currentCount)} plaque{Math.ceil(s.quantity / currentCount) > 1 ? 's' : ''} pour cette quantité
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Résultat prévisualisé */}
          {previewPlates !== null && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
              <span className="font-semibold text-emerald-700">Résultat personnalisé : </span>
              <span className="text-emerald-700">
                {previewPlates} plaque{previewPlates > 1 ? 's' : ''} au total
              </span>
              {autoResult?.feasible && previewPlates !== autoResult.platesNeeded && (
                <span className="text-xs text-slate-400 ml-2">
                  (auto = {autoResult.platesNeeded})
                </span>
              )}
            </div>
          )}

          {!isCustomMode && slotsInGroup.some(s => (customCounts[s.id] ?? 0) > 0) && (
            <p className="text-xs text-amber-600">
              Saisissez les poses pour tous les produits pour activer la personnalisation.
            </p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          {!readOnly ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser (auto)
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white">
                  Enregistrer
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" className="ml-auto" onClick={onClose}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
