'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

const BE_SHORTCUTS = [30, 45, 60, 120]
const BAT_SHORTCUTS = [30, 45, 60, 120]

export function SectionBureauEtudes() {
  const {
    hasBE, setHasBE,
    beTimeMinutes, setBeTimeMinutes,
    batTimeMinutes, setBatTimeMinutes,
    costResult,
  } = useCalculatorContext()

  const { beCost, batCost, beTotalCost } = costResult

  return (
    <SectionDisplay
      number="3"
      title="Bureau d'études"
      color="blue"
      enabled={hasBE}
      onToggle={setHasBE}
    >
      <div className="space-y-6">

        {/* ── Création / BE ── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-blue-800 font-semibold">Création / BE</Label>
            <span className="text-xs text-blue-500">90 €/h</span>
          </div>
          <GaugeSlider
            label="Temps"
            value={beTimeMinutes}
            min={0}
            max={480}
            unit="min"
            onChange={setBeTimeMinutes}
            formatValue={formatMinutes}
            gradientColors="from-blue-300 to-blue-600"
          />
          <div className="flex gap-2">
            {BE_SHORTCUTS.map((val) => (
              <button
                key={val}
                onClick={() => setBeTimeMinutes(val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  beTimeMinutes === val
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {formatMinutes(val)}
              </button>
            ))}
          </div>
          {beTimeMinutes > 0 && (
            <div className="flex justify-between text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              <span>Coût Création/BE</span>
              <span className="font-semibold">{beCost.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {/* ── BAT ── */}
        <div className="space-y-2 pt-4 border-t border-blue-100">
          <div className="flex justify-between items-center">
            <Label className="text-blue-800 font-semibold">BAT</Label>
            <span className="text-xs text-blue-500">70 €/h</span>
          </div>
          <GaugeSlider
            label="Temps"
            value={batTimeMinutes}
            min={0}
            max={480}
            unit="min"
            onChange={setBatTimeMinutes}
            formatValue={formatMinutes}
            gradientColors="from-blue-200 to-indigo-500"
          />
          <div className="flex gap-2">
            {BAT_SHORTCUTS.map((val) => (
              <button
                key={val}
                onClick={() => setBatTimeMinutes(val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  batTimeMinutes === val
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {formatMinutes(val)}
              </button>
            ))}
          </div>
          {batTimeMinutes > 0 && (
            <div className="flex justify-between text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg">
              <span>Coût BAT</span>
              <span className="font-semibold">{batCost.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {/* ── Total BE ── */}
        {(beTimeMinutes > 0 || batTimeMinutes > 0) && (
          <div className="flex justify-between items-center bg-blue-900 text-white px-4 py-3 rounded-lg">
            <span className="font-medium text-sm">Total Bureau d'études</span>
            <span className="font-bold text-lg">{beTotalCost.toFixed(2)} €</span>
          </div>
        )}

      </div>
    </SectionDisplay>
  )
}