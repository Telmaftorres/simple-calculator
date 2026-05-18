import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { SectionDisplay } from '../shared'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'
import { INK_SHORTCUTS, FINISHING_SHORTCUTS } from '@/lib/config/ui'

type SetupType = 'none' | 'standard' | 'complexe'

export function SectionImpression() {
  const {
    hasImpression, setHasImpression,
    printMode, setPrintMode,
    isRectoVerso, setIsRectoVerso,
    rectoVersoType, setRectoVersoType,
    hasVarnish, setHasVarnish,
    hasFlatColor, setHasFlatColor,
    inkMlPerPlate, setInkMlPerPlate,
    inkMlVerso, setInkMlVerso,
    varnishSurfacePercent, setVarnishSurfacePercent,
    flatColorSurfacePercent, setFlatColorSurfacePercent,
    printSetupType, setPrintSetupType,
    machineTimeMinOverride, setMachineTimeMinOverride,
    costResult,
  } = useCalculatorContext()

  const [showOverride, setShowOverride] = useState(false)

  const { printingCostData } = costResult
  const varnishRatio = hasVarnish ? varnishSurfacePercent : 0
  const flatColorRatio = hasFlatColor ? flatColorSurfacePercent : 0
  const standardPercent = 100

  return (
    <SectionDisplay
      number="4"
      title="Impression"
      color="purple"
      enabled={hasImpression}
      onToggle={setHasImpression}
    >
      <div className="space-y-4">

        {/* ── Calage impression ── */}
        <div className="space-y-2">
          <Label className="text-purple-900 font-medium">Calage impression</Label>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
            <button
              onClick={() => setPrintSetupType('none')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                printSetupType === 'none'
                  ? 'bg-white shadow-sm text-slate-700 ring-1 ring-slate-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Aucun
            </button>
            <button
              onClick={() => setPrintSetupType('standard')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                printSetupType === 'standard'
                  ? 'bg-white shadow-sm text-amber-700 ring-1 ring-amber-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setPrintSetupType('complexe')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                printSetupType === 'complexe'
                  ? 'bg-white shadow-sm text-red-700 ring-1 ring-red-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              Complexe
            </button>
          </div>
          {printSetupType !== 'none' && (
            <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
              printSetupType === 'standard'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}>
              + {printSetupType === 'standard' ? '15' : '25'} € forfait {printSetupType}
            </div>
          )}
        </div>

        {/* ── Mode impression ── */}
        <div className="flex justify-between items-center">
          <Label>Mode d&apos;Impression</Label>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-full">
            <button
              onClick={() => setPrintMode('production')}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${printMode === 'production' ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Production
            </button>
            <button
              onClick={() => setPrintMode('quality')}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${printMode === 'quality' ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Qualité
            </button>
          </div>
        </div>

        {/* ── Type impression ── */}
        <div className="flex justify-between items-center">
          <Label>Type d&apos;Impression</Label>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-full">
            <button
              onClick={() => { setIsRectoVerso(false); setRectoVersoType(null) }}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${!isRectoVerso ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Recto Seul
            </button>
            <button
              onClick={() => setIsRectoVerso(true)}
              className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${isRectoVerso ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Recto / Verso
            </button>
          </div>
        </div>

        {isRectoVerso && (
          <div>
            <Label className="mb-2 block">Visuel Recto / Verso</Label>
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                onClick={() => setRectoVersoType('identical')}
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${rectoVersoType === 'identical' ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                Identique
              </button>
              <button
                onClick={() => setRectoVersoType('different')}
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${rectoVersoType === 'different' ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                Différent
              </button>
            </div>
          </div>
        )}

        {/* ── Encre ── */}
        {rectoVersoType === 'different' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <GaugeSlider
                label="Encre Recto (ml / plaque)"
                value={inkMlPerPlate}
                max={100}
                min={0}
                unit="ml"
                onChange={setInkMlPerPlate}
                gradientColors="from-indigo-300 to-purple-600"
              />
              <div className="flex gap-2">
                {INK_SHORTCUTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setInkMlPerPlate(val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      inkMlPerPlate === val
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val} ml
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <GaugeSlider
                label="Encre Verso (ml / plaque)"
                value={inkMlVerso}
                max={100}
                min={0}
                unit="ml"
                onChange={setInkMlVerso}
                gradientColors="from-violet-300 to-fuchsia-600"
              />
              <div className="flex gap-2">
                {INK_SHORTCUTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setInkMlVerso(val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      inkMlVerso === val
                        ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val} ml
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <GaugeSlider
              label="Encre (ml / plaque)"
              value={inkMlPerPlate}
              max={100}
              min={0}
              unit="ml"
              onChange={setInkMlPerPlate}
              gradientColors="from-indigo-300 to-purple-600"
            />
            <div className="flex gap-2">
              {INK_SHORTCUTS.map((val) => (
                <button
                  key={val}
                  onClick={() => setInkMlPerPlate(val)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    inkMlPerPlate === val
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {val} ml
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Finitions ── */}
        <div>
          <Label className="mb-2 block">Finitions</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setHasVarnish(!hasVarnish)}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              Vernis
            </button>
            <button
              onClick={() => setHasFlatColor(!hasFlatColor)}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              Blanc
            </button>
          </div>

          {hasVarnish && (
            <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <GaugeSlider
                label="Surface Vernis"
                value={varnishSurfacePercent}
                max={100}
                min={0}
                unit="%"
                onChange={setVarnishSurfacePercent}
                gradientColors="from-purple-200 to-purple-500"
              />
              <div className="flex gap-2">
                {FINISHING_SHORTCUTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setVarnishSurfacePercent(val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      varnishSurfacePercent === val
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasFlatColor && (
            <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <GaugeSlider
                label="Surface Blanc"
                value={flatColorSurfacePercent}
                max={100}
                min={0}
                unit="%"
                onChange={setFlatColorSurfacePercent}
                gradientColors="from-violet-200 to-violet-500"
              />
              <div className="flex gap-2">
                {FINISHING_SHORTCUTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setFlatColorSurfacePercent(val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      flatColorSurfacePercent === val
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {(hasVarnish || hasFlatColor) && (
            <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Encre standard</span>
                <span className="font-semibold">{standardPercent}%</span>
              </div>
              {hasVarnish && (
                <div className="flex justify-between text-purple-700">
                  <span>Vernis (120 €/L)</span>
                  <span className="font-semibold">{varnishSurfacePercent}%</span>
                </div>
              )}
              {hasFlatColor && (
                <div className="flex justify-between text-violet-700">
                  <span>Blanc (120 €/L)</span>
                  <span className="font-semibold">{flatColorSurfacePercent}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Temps machine ── */}
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 space-y-2">
          <div className="flex justify-between items-center text-xs text-purple-800">
            <span>{machineTimeMinOverride != null ? 'Temps machine (personnalisé) :' : 'Temps machine :'}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{formatMinutes(printingCostData.machineTimeMin)}</span>
              {machineTimeMinOverride == null && (
                <button
                  type="button"
                  onClick={() => setShowOverride(v => !v)}
                  className="text-xs text-purple-400 hover:text-purple-700 underline underline-offset-2 transition-colors"
                >
                  Personnaliser
                </button>
              )}
            </div>
          </div>
          {(showOverride || machineTimeMinOverride != null) && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                value={machineTimeMinOverride ?? ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setMachineTimeMinOverride(isNaN(v) || e.target.value === '' ? null : v)
                }}
                placeholder="Temps forcé (min)…"
                autoFocus
                className="flex-1 h-8 px-2 text-sm border border-purple-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => { setMachineTimeMinOverride(null); setShowOverride(false) }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors whitespace-nowrap"
              >
                Auto
              </button>
            </div>
          )}
        </div>

      </div>
    </SectionDisplay>
  )
}
