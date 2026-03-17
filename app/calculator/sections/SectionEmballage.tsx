'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '../../components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/hooks/useCalculator'
import type { Plate } from '@/types/calculator'

interface SectionEmballageProps {
  hasPackaging: boolean
  setHasPackaging: (v: boolean) => void
  packagingPlateId: string
  setPackagingPlateId: (v: string) => void
  packagingQuantity: number
  setPackagingQuantity: (v: number) => void
  packagingCuttingTimePerPoseSeconds: number
  setPackagingCuttingTimePerPoseSeconds: (v: number) => void
  plates: Plate[]
  packagingMaterialCost: number
  packagingCuttingCost: number
  packagingTotalCost: number
}

export function SectionEmballage({
  hasPackaging,
  setHasPackaging,
  packagingPlateId,
  setPackagingPlateId,
  packagingQuantity,
  setPackagingQuantity,
  packagingCuttingTimePerPoseSeconds,
  setPackagingCuttingTimePerPoseSeconds,
  plates,
  packagingMaterialCost,
  packagingCuttingCost,
  packagingTotalCost,
}: SectionEmballageProps) {
  const packagingPlates = plates.filter((p) =>
    p.material.toLowerCase().includes('bc') ||
    p.material.toLowerCase().includes('carton')
  )

  return (
    <SectionDisplay number="8" title="Emballage (Optionnel)" color="amber">
      <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
        <input
          type="checkbox"
          id="hasPackaging"
          checked={hasPackaging}
          onChange={(e) => setHasPackaging(e.target.checked)}
          className="h-5 w-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
        />
        <Label htmlFor="hasPackaging" className="text-amber-900 cursor-pointer font-medium">
          Ajouter un emballage carton (BC)
        </Label>
      </div>

      {hasPackaging && (
        <div className="space-y-5">
          {packagingPlates.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4">
              Aucune matière carton/BC disponible.{' '}
              <a href="/dashboard/plates" className="text-amber-600 underline">
                Ajouter une matière
              </a>
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Matière d&apos;emballage</Label>
                <select
                  value={packagingPlateId}
                  onChange={(e) => setPackagingPlateId(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                >
                  <option value="">Choisir une matière...</option>
                  {packagingPlates.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.name} — {p.material} ({p.width}×{p.height}mm) — {p.cost.toFixed(2)}€/unité
                    </option>
                  ))}
                </select>
              </div>

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

              {packagingPlateId && packagingQuantity > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Matière ({packagingQuantity} unités)</span>
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
            </>
          )}
        </div>
      )}
    </SectionDisplay>
  )
}
