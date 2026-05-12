'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'
import { PACK_SHORTCUTS } from '@/lib/config/ui'
import { ShortcutButtons } from '@/components/calculator/ShortcutButtons'

export function SectionConditionnement() {
  const {
    hasConditionnement, setHasConditionnement,
    packTimePerPieceSeconds, setPackTimePerPieceSeconds,
    hasAssemblyNotice, setHasAssemblyNotice,
    hasPoseEtiquette, setHasPoseEtiquette,
  } = useCalculatorContext()

  return (
    <SectionDisplay
      number="7"
      title="Conditionnement"
      color="teal"
      enabled={hasConditionnement}
      onToggle={setHasConditionnement}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <GaugeSlider
            label="Temps par Pièce"
            value={packTimePerPieceSeconds}
            min={0}
            max={300}
            unit="sec"
            onChange={setPackTimePerPieceSeconds}
            formatValue={formatTimeSeconds}
            gradientColors="from-teal-300 to-emerald-600"
          />
          <ShortcutButtons
            values={PACK_SHORTCUTS}
            selected={packTimePerPieceSeconds}
            onSelect={setPackTimePerPieceSeconds}
            activeClass="bg-teal-500 text-white border-teal-500"
            formatValue={(val) => val === 0 ? '0s' : formatTimeSeconds(val)}
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2 bg-teal-50 p-3 rounded-lg border border-teal-100">
            <input
              type="checkbox"
              id="assemblyNotice"
              checked={hasAssemblyNotice}
              onChange={(e) => setHasAssemblyNotice(e.target.checked)}
              className="h-5 w-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <Label htmlFor="assemblyNotice" className="text-teal-900 cursor-pointer font-medium">
              Ajouter Notice de Montage (+0.10€ / pce)
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-teal-50 p-3 rounded-lg border border-teal-100">
            <input
              type="checkbox"
              id="poseEtiquette"
              checked={hasPoseEtiquette}
              onChange={(e) => setHasPoseEtiquette(e.target.checked)}
              className="h-5 w-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <Label htmlFor="poseEtiquette" className="text-teal-900 cursor-pointer font-medium">
              Pose étiquette
            </Label>
          </div>
        </div>
      </div>
    </SectionDisplay>
  )
}
