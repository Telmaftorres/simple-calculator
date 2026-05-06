'use client'

import { useState, useMemo, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { Check, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'
import { CalculatorContext } from '../../context/CalculatorContext'
import { formatTimeSeconds } from '@/lib/format'
import type { ProductSlot, AmalgameGroup, Plate } from '@/types/calculator'
import { GROUP_COLORS } from '@/types/calculator'
import { INK_SHORTCUTS, FINISHING_SHORTCUTS, CUTTING_SHORTCUTS } from '@/lib/config/ui'
import { calculateMultiImposition } from '@/lib/calculation/amalgame-multi-imposition'
import { v4 as uuidv4 } from 'uuid'

export function GroupEditor({
  initial,
  products,
  onSave,
  onCancel,
  plates: platesFromProp,
  groupCount,
}: {
  initial?: AmalgameGroup
  products: ProductSlot[]
  onSave: (g: AmalgameGroup, productIds: string[]) => void
  onCancel: () => void
  plates?: Plate[]
  groupCount?: number
}) {
  const ctx = useContext(CalculatorContext)
  const plates = platesFromProp ?? ctx?.plates ?? []
  const currentGroupCount = groupCount ?? ctx?.amalgameGroups.length ?? 0

  const [amalgameType, setAmalgameType] = useState<'impression_decoupe' | 'decoupe'>(initial?.amalgameType ?? 'impression_decoupe')
  const [cuttingTimePerPoseSeconds, setCuttingTimePerPoseSeconds] = useState(initial?.cuttingTimePerPoseSeconds ?? 0)
  const [cuttingSetupType, setCuttingSetupType] = useState<'none' | 'standard' | 'complexe'>(initial?.cuttingSetupType ?? 'none')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initial ? products.filter(p => p.amalgameGroupId === initial.id).map(p => p.id) : []
  )
  const [printMode, setPrintMode] = useState<'production' | 'quality'>(initial?.printMode ?? 'production')
  const [isRectoVerso, setIsRectoVerso] = useState(initial?.isRectoVerso ?? false)
  const [rectoVersoType, setRectoVersoType] = useState<'identical' | 'different' | null>(initial?.rectoVersoType ?? null)
  const [inkMlPerPlate, setInkMlPerPlate] = useState(initial?.inkMlPerPlate ?? 20)
  const [inkMlVerso, setInkMlVerso] = useState(initial?.inkMlVerso ?? 0)
  const [hasVarnish, setHasVarnish] = useState(initial?.hasVarnish ?? false)
  const [hasFlatColor, setHasFlatColor] = useState(initial?.hasFlatColor ?? false)
  const [varnishSurfacePercent, setVarnishSurfacePercent] = useState(initial?.varnishSurfacePercent ?? 0)
  const [flatColorSurfacePercent, setFlatColorSurfacePercent] = useState(initial?.flatColorSurfacePercent ?? 0)
  const [printSetupType, setPrintSetupType] = useState<'none' | 'standard' | 'complexe'>(initial?.printSetupType ?? 'none')

  const toggleProduct = (id: string) =>
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id))
  const plateIds = selectedProducts.map(p => p.selectedPlateId).filter(Boolean)
  const uniquePlateIds = [...new Set(plateIds)]
  const hasPlateConflict = selectedProductIds.length > 1 && uniquePlateIds.length > 1
  const commonPlateId = uniquePlateIds.length === 1 ? uniquePlateIds[0] : ''
  const commonPlate = plates.find(p => p.id.toString() === commonPlateId)

  const multiImpPreview = useMemo(() => {
    if (!commonPlate || selectedProducts.length < 2) return null
    const impProducts = selectedProducts.map(p => ({
      name: p.productSearch || p.id,
      width: p.flatWidth,
      height: p.flatHeight,
      quantity: p.quantity,
    }))
    if (impProducts.some(p => p.width <= 0 || p.height <= 0 || p.quantity <= 0)) return null
    return calculateMultiImposition(impProducts, commonPlate, 10, 10)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonPlate, selectedProducts.map(p => `${p.id}:${p.flatWidth}x${p.flatHeight}x${p.quantity}`).join(',')])

  const canSave = !hasPlateConflict

  const handleSave = () => {
    if (!canSave) return
    const group: AmalgameGroup = {
      id: initial?.id ?? uuidv4(),
      name: initial?.name ?? `Amalgame ${currentGroupCount + 1}`,
      colorIndex: initial?.colorIndex ?? (currentGroupCount % GROUP_COLORS.length),
      amalgameType, plateId: commonPlateId,
      cuttingTimePerPoseSeconds, cuttingSetupType,
      printMode, isRectoVerso, rectoVersoType,
      inkMlPerPlate, inkMlVerso,
      hasVarnish, hasFlatColor,
      varnishSurfacePercent, flatColorSurfacePercent,
      printSetupType,
    }
    onSave(group, selectedProductIds)
  }

  return (
    <div className="border border-violet-200 rounded-xl bg-violet-50/40 p-4 space-y-4">

      {/* Type d'amalgame */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-600">Type d&apos;amalgame</Label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAmalgameType('impression_decoupe')}
            className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg border transition-all ${amalgameType === 'impression_decoupe' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            Impression + Découpe
          </button>
          <button type="button" onClick={() => setAmalgameType('decoupe')}
            className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg border transition-all ${amalgameType === 'decoupe' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            Découpe uniquement
          </button>
        </div>
      </div>

      {/* Sélection des produits */}
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-600">Produits à amalgamer</Label>
        <div className="flex flex-wrap gap-2">
          {products.map(p => {
            const selected = selectedProductIds.includes(p.id)
            return (
              <button type="button" key={p.id} onClick={() => toggleProduct(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  selected
                    ? amalgameType === 'impression_decoupe'
                      ? 'bg-violet-100 text-violet-800 border-violet-300'
                      : 'bg-orange-100 text-orange-800 border-orange-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {selected && <Check className="h-3 w-3" />}
                {p.productSearch || 'Produit sans nom'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Matière commune */}
      {selectedProductIds.length > 0 && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
          hasPlateConflict
            ? 'bg-red-50 border-red-200 text-red-700'
            : commonPlate
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {hasPlateConflict ? (
            <><span className="font-bold">⚠</span><span>Ces produits n&apos;ont pas la même matière — amalgame impossible.</span></>
          ) : commonPlate ? (
            <><span>✓</span><span>Matière partagée : <strong>{commonPlate.name}</strong> — {commonPlate.cost.toFixed(2)} €/plaque</span></>
          ) : (
            <><span>ℹ</span><span>Aucune matière définie sur les produits sélectionnés.</span></>
          )}
        </div>
      )}

      {/* Aperçu optimisation */}
      {multiImpPreview && (
        <div className={`rounded-lg border p-3 space-y-2 text-sm ${multiImpPreview.isBetterThanSeparate ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`flex items-center gap-2 font-semibold ${multiImpPreview.isBetterThanSeparate ? 'text-emerald-800' : 'text-amber-800'}`}>
            {multiImpPreview.isBetterThanSeparate
              ? <TrendingDown className="h-4 w-4 flex-shrink-0" />
              : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            {multiImpPreview.isBetterThanSeparate
              ? `Optimisation : ${multiImpPreview.platesNeeded} plaque${multiImpPreview.platesNeeded > 1 ? 's' : ''} (−${multiImpPreview.savingsPercent}% vs séparé)`
              : `L'amalgame n'est pas bénéfique (${multiImpPreview.platesNeeded} pl. vs ${multiImpPreview.separatePlatesTotal} séparément)`}
          </div>
          <div className="space-y-1">
            {multiImpPreview.strips.map((strip, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">{strip.productName || `Produit ${strip.productIndex + 1}`}</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${multiImpPreview.isBetterThanSeparate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {strip.cols} × {strip.rows} = {strip.posesPerPlate} poses/plaque{strip.rotated ? ' ↻' : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
            <span>Taux de remplissage</span>
            <span className="font-semibold">{Math.round(multiImpPreview.utilization * 100)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Si imprimés séparément</span>
            <span>{multiImpPreview.separatePlatesTotal} plaques</span>
          </div>
        </div>
      )}

      {/* Impression (seulement impression + découpe) */}
      {amalgameType === 'impression_decoupe' && (
        <div className="space-y-3 p-3 bg-purple-50/60 rounded-lg border border-purple-100">
          <Label className="text-xs font-semibold text-purple-900">Impression commune à tous les produits</Label>

          <div className="flex gap-2 bg-white p-1 rounded-lg">
            <button type="button" onClick={() => setPrintMode('production')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${printMode === 'production' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Production</button>
            <button type="button" onClick={() => setPrintMode('quality')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${printMode === 'quality' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Qualité</button>
          </div>

          <div className="flex gap-2 bg-white p-1 rounded-lg">
            <button type="button" onClick={() => { setIsRectoVerso(false); setRectoVersoType(null) }} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Recto seul</button>
            <button type="button" onClick={() => setIsRectoVerso(true)} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Recto / Verso</button>
          </div>

          {isRectoVerso && (
            <div className="flex gap-2 bg-white p-1 rounded-lg">
              <button type="button" onClick={() => setRectoVersoType('identical')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${rectoVersoType === 'identical' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Identique</button>
              <button type="button" onClick={() => setRectoVersoType('different')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${rectoVersoType === 'different' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Différent</button>
            </div>
          )}

          {isRectoVerso && rectoVersoType === 'different' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <GaugeSlider label="Encre Recto (ml / plaque)" value={inkMlPerPlate} min={0} max={100} unit="ml" onChange={setInkMlPerPlate} gradientColors="from-indigo-300 to-purple-600" />
                <div className="flex gap-2">
                  {INK_SHORTCUTS.map(val => (
                    <button type="button" key={val} onClick={() => setInkMlPerPlate(val)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${inkMlPerPlate === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val} ml</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <GaugeSlider label="Encre Verso (ml / plaque)" value={inkMlVerso} min={0} max={100} unit="ml" onChange={setInkMlVerso} gradientColors="from-violet-300 to-fuchsia-600" />
                <div className="flex gap-2">
                  {INK_SHORTCUTS.map(val => (
                    <button type="button" key={val} onClick={() => setInkMlVerso(val)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${inkMlVerso === val ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val} ml</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <GaugeSlider label="Encre (ml / plaque)" value={inkMlPerPlate} min={0} max={100} unit="ml" onChange={setInkMlPerPlate} gradientColors="from-indigo-300 to-purple-600" />
              <div className="flex gap-2">
                {INK_SHORTCUTS.map(val => (
                  <button type="button" key={val} onClick={() => setInkMlPerPlate(val)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${inkMlPerPlate === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val} ml</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-purple-800">Finitions</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setHasVarnish(!hasVarnish)} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Vernis</button>
              <button type="button" onClick={() => setHasFlatColor(!hasFlatColor)} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Blanc</button>
            </div>
            {hasVarnish && (
              <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                <GaugeSlider label="Surface Vernis" value={varnishSurfacePercent} min={0} max={100} unit="%" onChange={setVarnishSurfacePercent} gradientColors="from-purple-200 to-purple-500" />
                <div className="flex gap-2">
                  {FINISHING_SHORTCUTS.map(val => (
                    <button type="button" key={val} onClick={() => setVarnishSurfacePercent(val)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${varnishSurfacePercent === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val}%</button>
                  ))}
                </div>
              </div>
            )}
            {hasFlatColor && (
              <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                <GaugeSlider label="Surface Aplat" value={flatColorSurfacePercent} min={0} max={100} unit="%" onChange={setFlatColorSurfacePercent} gradientColors="from-violet-200 to-violet-500" />
                <div className="flex gap-2">
                  {FINISHING_SHORTCUTS.map(val => (
                    <button type="button" key={val} onClick={() => setFlatColorSurfacePercent(val)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${flatColorSurfacePercent === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val}%</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-purple-900 font-medium text-xs">Calage impression</Label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(['none', 'standard', 'complexe'] as const).map(type => (
                <button type="button" key={type} onClick={() => setPrintSetupType(type)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    printSetupType === type
                      ? type === 'none' ? 'bg-white text-slate-700 shadow-sm' : type === 'standard' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}>
                  {type === 'none' ? 'Aucun' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Découpe commune */}
      <div className="space-y-3 p-3 bg-orange-50/60 rounded-lg border border-orange-100">
        <Label className="text-xs font-semibold text-orange-800">Découpe commune à tous les produits</Label>
        <div className="space-y-2">
          <GaugeSlider label="Temps par pose" value={cuttingTimePerPoseSeconds} min={0} max={300} unit="sec"
            onChange={setCuttingTimePerPoseSeconds} formatValue={formatTimeSeconds} gradientColors="from-yellow-300 to-orange-600" />
          <div className="flex gap-2">
            {CUTTING_SHORTCUTS.map(val => (
              <button type="button" key={val} onClick={() => setCuttingTimePerPoseSeconds(val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${cuttingTimePerPoseSeconds === val ? 'bg-orange-500 text-white border-orange-500' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                {val === 0 ? '0s' : formatTimeSeconds(val)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-orange-800">Calage découpe</Label>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(['none', 'standard', 'complexe'] as const).map(type => (
              <button type="button" key={type} onClick={() => setCuttingSetupType(type)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  cuttingSetupType === type
                    ? type === 'none' ? 'bg-white text-slate-700 shadow-sm' : type === 'standard' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-red-700 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}>
                {type === 'none' ? 'Aucun' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
        <Button type="button" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
          onClick={handleSave} disabled={!canSave}>
          <Check className="h-3.5 w-3.5 mr-1" /> Enregistrer
        </Button>
      </div>
    </div>
  )
}
