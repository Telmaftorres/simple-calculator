'use client'

import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds, formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'
import { CUTTING_SHORTCUTS } from '@/lib/config/ui'
import { ShortcutButtons } from '@/components/calculator/ShortcutButtons'

export function SectionDecoupe() {
  const {
    cuttingTimePerPoseSeconds, setCuttingTimePerPoseSeconds,
    cuttingSetupType, setCuttingSetupType,
    costResult,
  } = useCalculatorContext()

  const { cuttingMachineTimeMin, cuttingSetupCost } = costResult

  return (
    <SectionDisplay number="5" title="Découpe" color="orange">
      <div className="space-y-4">

        {/* ── Calage découpe ── */}
        <div className="space-y-2">
          <Label className="text-orange-900 font-medium">Calage découpe</Label>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
            <button
              onClick={() => setCuttingSetupType('none')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                cuttingSetupType === 'none'
                  ? 'bg-white shadow-sm text-slate-700 ring-1 ring-slate-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Aucun
            </button>
            <button
              onClick={() => setCuttingSetupType('standard')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                cuttingSetupType === 'standard'
                  ? 'bg-white shadow-sm text-amber-700 ring-1 ring-amber-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setCuttingSetupType('complexe')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                cuttingSetupType === 'complexe'
                  ? 'bg-white shadow-sm text-red-700 ring-1 ring-red-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Complexe
            </button>
          </div>
          {cuttingSetupType !== 'none' && (
            <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
              cuttingSetupType === 'standard'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}>
              + {cuttingSetupType === 'standard' ? '15' : '25'} € forfait {cuttingSetupType}
            </div>
          )}
        </div>

        {/* ── Temps par pose ── */}
        <div className="space-y-2">
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
          <ShortcutButtons
            values={CUTTING_SHORTCUTS}
            selected={cuttingTimePerPoseSeconds}
            onSelect={setCuttingTimePerPoseSeconds}
            activeClass="bg-orange-500 text-white border-orange-500"
            formatValue={formatTimeSeconds}
          />
        </div>

        {/* ── Résumé temps ── */}
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-xs text-orange-800 space-y-1">
          <div className="flex justify-between">
            <span>Temps machine</span>
            <span className="font-medium">{formatMinutes(cuttingMachineTimeMin)}</span>
          </div>
          {cuttingSetupType !== 'none' && (
            <div className="flex justify-between">
              <span>Forfait calage {cuttingSetupType}</span>
              <span className="font-medium">{cuttingSetupCost.toFixed(2)} €</span>
            </div>
          )}
        </div>

      </div>
    </SectionDisplay>
  )
}
