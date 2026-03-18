'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '../../components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds, formatMinutes } from '@/hooks/useCalculator'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionDecoupe() {
  const {
    cuttingTimePerPoseSeconds, setCuttingTimePerPoseSeconds,
    hasCuttingSetup, setHasCuttingSetup,
    cuttingSetupTimeMin, cuttingMachineTimeMin,
    cuttingMachineCost, cuttingSetupCost,
  } = useCalculatorContext()

  return (
    <SectionDisplay number="4" title="Découpe" color="orange">
      <GaugeSlider
        label="Temps par Pose"
        value={cuttingTimePerPoseSeconds}
        min={0}
        max={300}
        unit="sec"
        onChange={setCuttingTimePerPoseSeconds}
        formatValue={formatTimeSeconds}
        gradientColors="from-yellow-300 to-orange-600"
      />

      <div className="mt-4 flex items-center space-x-2 bg-orange-50 p-3 rounded-lg border border-orange-100">
        <input
          type="checkbox"
          id="hasCuttingSetup"
          checked={hasCuttingSetup}
          onChange={(e) => setHasCuttingSetup(e.target.checked)}
          className="h-5 w-5 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
        />
        <Label htmlFor="hasCuttingSetup" className="text-orange-900 cursor-pointer font-medium">
          Inclure calage découpe (15 min)
        </Label>
      </div>

      <div className="mt-3 bg-orange-50 p-3 rounded-lg border border-orange-100 text-xs text-orange-800 space-y-1">
        <div className="flex justify-between">
          <span>Temps machine</span>
          <span className="font-medium">{formatMinutes(cuttingMachineTimeMin)}</span>
        </div>
        {hasCuttingSetup && (
          <div className="flex justify-between">
            <span>Calage</span>
            <span className="font-medium">{cuttingSetupTimeMin} min</span>
          </div>
        )}
      </div>
    </SectionDisplay>
  )
}