'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '../../components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionEmballage() {
  const {
    hasPackaging, setHasPackaging,
    packagingPlateId, setPackagingPlateId,
    packagingQuantity, setPackagingQuantity,
    packagingWidth, setPackagingWidth,
    packagingHeight, setPackagingHeight,
    packagingCuttingTimePerPoseSeconds, setPackagingCuttingTimePerPoseSeconds,
    plates,
    packagingMaterialCost, packagingCuttingCost, packagingTotalCost,
    packagingItemsPerPlate, packagingPlatesNeeded,
  } = useCalculatorContext()

  const packagingPlates = plates.filter((p) =>
    p.material.toLowerCase().includes('bc') ||
    p.material.toLowerCase().includes('carton')
  )

  return (
    <SectionDisplay
      number="8"
      title="Emballage"
      color="amber"
      enabled={hasPackaging}
      onToggle={setHasPackaging}
    >
      {packagingPlates.length === 0 ? (
        <p className="text-sm text-slate-500 italic text-center py-4">
          Aucune matière carton/BC disponible.{' '}
          <a href="/dashboard/plates" className="text-amber-600 underline">Ajouter une matière</a>
        </p>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Matière d&apos;emballage</Label>
            <select
              value={packagingPlateId}
              onChange={(e) => setPackagingPlateId(e.target.value)}
              className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Choisir une matière...</option>
              {packagingPlates.map((p) => (
                <option key={p.id} value={p.id.toString()}>
                  {p.name} — {p.material} ({p.width}×{p.height}mm) — {p.cost.toFixed(2)}€/plaque
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Format du carton (mm)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={packagingWidth || ''}
                  onChange={(e) => setPackagingWidth(parseInt(e.target.value) || 0)}
                  placeholder="Largeur"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <span className="text-xs text-slate-500">L</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={packagingHeight || ''}
                  onChange={(e) => setPackagingHeight(parseInt(e.target.value) || 0)}
                  placeholder="Hauteur"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <span className="text-xs text-slate-500">H</span>
              </div>
            </div>
          </div>

          {packagingItemsPerPlate > 0 && (
            <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-amber-700">{packagingItemsPerPlate}</div>
                <div className="text-xs text-amber-500 uppercase">Cartons / Plaque</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-700">{packagingPlatesNeeded}</div>
                <div className="text-xs text-slate-400 uppercase">Plaques nécessaires</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantité d&apos;emballages</Label>
            <input
              type="number"
              min={1}
              value={packagingQuantity || ''}
              onChange={(e) => setPackagingQuantity(parseInt(e.target.value) || 0)}
              placeholder="Ex : 500"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <GaugeSlider
            label="Temps de découpe par pose"
            value={packagingCuttingTimePerPoseSeconds}
            min={20}
            max={300}
            unit="sec"
            onChange={setPackagingCuttingTimePerPoseSeconds}
            formatValue={formatTimeSeconds}
            gradientColors="from-amber-300 to-orange-500"
          />

          {packagingPlateId && packagingQuantity > 0 && packagingItemsPerPlate > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Matière ({packagingPlatesNeeded} plaque(s) × {plates.find(p => p.id.toString() === packagingPlateId)?.cost.toFixed(2)}€)
                </span>
                <span className="font-medium">{packagingMaterialCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Découpe</span>
                <span className="font-medium">{packagingCuttingCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-2 font-bold text-amber-800">
                <span>Total Emballage</span>
                <span>{packagingTotalCost.toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionDisplay>
  )
}
