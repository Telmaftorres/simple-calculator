'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

const PACK_SHORTCUTS = [30, 45, 60, 90, 120]

export function SectionConditionnement() {
  const {
    hasConditionnement, setHasConditionnement,
    packTimePerPieceSeconds, setPackTimePerPieceSeconds,
    hasAssemblyNotice, setHasAssemblyNotice,
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
          <div className="flex gap-2">
            {PACK_SHORTCUTS.map((val) => (
              <button
                key={val}
                onClick={() => setPackTimePerPieceSeconds(val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  packTimePerPieceSeconds === val
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {val === 0 ? '0s' : formatTimeSeconds(val)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2 bg-teal-50 p-3 rounded-lg border border-teal-100">
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
      </div>
    </SectionDisplay>
  )
}