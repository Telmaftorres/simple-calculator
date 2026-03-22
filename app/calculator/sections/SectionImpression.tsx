import { Label } from '@/components/ui/label'
import { SectionDisplay } from '../shared'
import { GaugeSlider } from '../../components/GaugeSlider'
import { PlateVisualizer } from '../../components/PlateVisualizer'
import { formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionImpression() {
  const {
    hasImpression, setHasImpression,
    printMode, setPrintMode,
    isRectoVerso, setIsRectoVerso,
    rectoVersoType, setRectoVersoType,
    hasVarnish, setHasVarnish,
    hasFlatColor, setHasFlatColor,
    printSurfacePercent, setPrintSurfacePercent,
    hasPrintSetup, setHasPrintSetup,
    printingCostData,
    impositionResult,
    selectedPlate,
  } = useCalculatorContext()

  return (
    <SectionDisplay
      number="3"
      title="Impression"
      color="purple"
      enabled={hasImpression}
      onToggle={setHasImpression}
    >
      <div className="space-y-4">
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

        <div>
          <Label className="mb-2 block">Finitions</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setHasVarnish(!hasVarnish)}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              Vernis (+5%)
            </button>
            <button
              onClick={() => setHasFlatColor(!hasFlatColor)}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              Aplat (+5%)
            </button>
          </div>
          {(hasVarnish || hasFlatColor) && (
            <p className="text-xs text-purple-600 mt-1 text-right">
              Majoration encre : +{(hasVarnish ? 5 : 0) + (hasFlatColor ? 5 : 0)}%
            </p>
          )}
        </div>

        <GaugeSlider
          label="Surface Imprimée"
          value={printSurfacePercent}
          max={100}
          unit="%"
          onChange={setPrintSurfacePercent}
          gradientColors="from-indigo-300 to-purple-600"
        />

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

        {impositionResult && selectedPlate && (
          <div className="mt-4">
            <PlateVisualizer
              plate={selectedPlate}
              layout={impositionResult.layout}
              itemsPerPlate={impositionResult.itemsPerPlate}
              printSurfacePercent={printSurfacePercent}
            />
          </div>
        )}
      </div>
    </SectionDisplay>
  )
}