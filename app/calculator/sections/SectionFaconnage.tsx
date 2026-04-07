'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { GaugeSlider } from '@/components/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

const ASSEMBLY_SHORTCUTS = [30, 45, 60, 90, 120]

export function SectionFaconnage() {
  const {
    hasFaconnage, setHasFaconnage,
    assemblyTimePerPieceSeconds, setAssemblyTimePerPieceSeconds,
    selectedConsumables,
    consumables,
    currentConsumableId, setCurrentConsumableId,
    currentConsumableSize, setCurrentConsumableSize,
    handleAddConsumable, handleRemoveConsumable,
    costResult,
  } = useCalculatorContext()

  const { consumablesCost } = costResult

  return (
    <SectionDisplay
      number="6"
      title="Façonnage"
      color="pink"
      enabled={hasFaconnage}
      onToggle={setHasFaconnage}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <GaugeSlider
            label="Temps par Pièce"
            value={assemblyTimePerPieceSeconds}
            min={0}
            max={300}
            unit="sec"
            onChange={setAssemblyTimePerPieceSeconds}
            formatValue={formatTimeSeconds}
            gradientColors="from-pink-300 to-rose-600"
          />
          <div className="flex gap-2">
            {ASSEMBLY_SHORTCUTS.map((val) => (
              <button
                key={val}
                onClick={() => setAssemblyTimePerPieceSeconds(val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  assemblyTimePerPieceSeconds === val
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {val === 0 ? '0s' : formatTimeSeconds(val)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-pink-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between">
            Consommables ({selectedConsumables.length})
            <span className="text-pink-600 font-bold">{consumablesCost.toFixed(2)}€</span>
          </h4>
          <div className="space-y-3">
            {selectedConsumables.map((sc) => (
              <div key={sc.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200 p-2 sm:p-3 rounded-md gap-2">
                <div>
                  <span className="font-medium text-slate-800 text-sm">{sc.name}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    Rouleau de {sc.size} m / {sc.price.toFixed(2)}€
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    {sc.sizePerItem} m / pose
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveConsumable(sc.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    Retirer
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="flex-1">
                <Label className="sr-only">Consommable</Label>
                <select
                  value={currentConsumableId}
                  onChange={(e) => setCurrentConsumableId(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choisir un consommable...</option>
                  {consumables.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.price.toFixed(2)}€ / {c.size}m)
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-32 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={currentConsumableSize === 0 ? '' : currentConsumableSize}
                  onChange={(e) => setCurrentConsumableSize(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm pr-8"
                  placeholder="0.20"
                />
                <div className="absolute right-3 top-2.5 text-slate-400 text-sm">m</div>
              </div>
              <Button
                onClick={handleAddConsumable}
                disabled={!currentConsumableId || currentConsumableSize <= 0}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SectionDisplay>
  )
}