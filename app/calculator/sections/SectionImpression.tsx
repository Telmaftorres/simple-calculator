import { Label } from '@/components/ui/label'
import { SectionDisplay } from '../shared'
import { GaugeSlider } from '../../components/GaugeSlider'
// import { PlateVisualizer } from '../../components/PlateVisualizer' // ✅ commenté — désactivé temporairement
import { formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

const INK_SHORTCUTS = [10, 25, 50, 75]
const FINISHING_SHORTCUTS = [10, 25, 50, 75]

export function SectionImpression() {
  const {
    hasImpression, setHasImpression,
    printMode, setPrintMode,
    isRectoVerso, setIsRectoVerso,
    rectoVersoType, setRectoVersoType,
    hasVarnish, setHasVarnish,
    hasFlatColor, setHasFlatColor,
    inkMlPerPlate, setInkMlPerPlate,
    varnishSurfacePercent, setVarnishSurfacePercent,
    flatColorSurfacePercent, setFlatColorSurfacePercent,
    hasPrintSetup, setHasPrintSetup,
    printingCostData,
  } = useCalculatorContext()

  // Part d'encre standard restante après finitions
  const varnishRatio = hasVarnish ? varnishSurfacePercent : 0
  const flatColorRatio = hasFlatColor ? flatColorSurfacePercent : 0
  const standardPercent = Math.max(0, 100 - varnishRatio - flatColorRatio)
  const finishingOverflow = varnishRatio + flatColorRatio > 100

  return (
    <SectionDisplay
      number="3"
      title="Impression"
      color="purple"
      enabled={hasImpression}
      onToggle={setHasImpression}
    >
      <div className="space-y-4">

        {/* Mode d'impression */}
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

        {/* Type d'impression */}
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

        {/* Visuel Recto/Verso */}
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

        {/* ── Encre standard ── */}
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
          {/* Raccourcis encre */}
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
              Aplat
            </button>
          </div>

          {/* Jauge vernis */}
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

          {/* Jauge aplat */}
          {hasFlatColor && (
            <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <GaugeSlider
                label="Surface Aplat"
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

          {/* Récap répartition encre */}
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
                  <span>Aplat (120 €/L)</span>
                  <span className="font-semibold">{flatColorSurfacePercent}%</span>
                </div>
              )}
              {finishingOverflow && (
                <p className="text-red-500 font-semibold pt-1">
                  ⚠️ Total finitions dépasse 100% — réduire vernis ou aplat
                </p>
              )}
            </div>
          )}
        </div>

        {/* Calage */}
        <div className="flex items-center space-x-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
          <input
            type="checkbox"
            id="hasPrintSetup"
            checked={hasPrintSetup}
            onChange={(e) => setHasPrintSetup(e.target.checked)}
            className="h-5 w-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
          />
          <Label htmlFor="hasPrintSetup" className="text-purple-900 cursor-pointer font-medium">
            Inclure calage impression (15 min)
          </Label>
        </div>

        {/* Temps */}
        <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-xs text-purple-800">
          <span>Temps machine :</span>
          <span className="font-bold text-sm">{formatMinutes(printingCostData.machineTimeMin)}</span>
        </div>
        {hasPrintSetup && printingCostData.setupTimeMin > 0 && (
          <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-xs text-purple-800 -mt-2">
            <span>Calage :</span>
            <span className="font-bold text-sm">{printingCostData.setupTimeMin} min</span>
          </div>
        )}

        {/* PlateVisualizer — désactivé temporairement */}
        {/* {impositionResult && selectedPlate && (
          <div className="mt-4">
            <PlateVisualizer
              plate={selectedPlate}
              layout={impositionResult.layout}
              itemsPerPlate={impositionResult.itemsPerPlate}
              printSurfacePercent={inkMlPerPlate}
            />
          </div>
        )} */}

      </div>
    </SectionDisplay>
  )
}