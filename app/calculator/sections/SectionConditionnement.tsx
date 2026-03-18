'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '../../components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/hooks/useCalculator'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionConditionnement() {
  const {
    hasConditionnement, setHasConditionnement,
    packTimePerPieceSeconds, setPackTimePerPieceSeconds,
    hasAssemblyNotice, setHasAssemblyNotice,
  } = useCalculatorContext()

  return (
    <SectionDisplay
      number="6"
      title="Conditionnement"
      color="teal"
      enabled={hasConditionnement}
      onToggle={setHasConditionnement}
    >
      <div className="space-y-4">
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
        {packTimePerPieceSeconds === 0 && (
          <p className="text-xs text-slate-400 italic text-center mt-2">Glisser pour ajouter</p>
        )}
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