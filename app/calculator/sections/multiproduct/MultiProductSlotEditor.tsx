'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { Trash2, Plus, Layers } from 'lucide-react'
import { useCalculatorContext } from '../../context/CalculatorContext'
import { formatTimeSeconds } from '@/lib/format'
import type { AmalgameGroup } from '@/types/calculator'
import { GROUP_COLORS } from '@/types/calculator'
import { INK_SHORTCUTS, FINISHING_SHORTCUTS, CUTTING_SHORTCUTS } from '@/lib/config/ui'
import { SlotImpositionDisplay } from './SlotImpositionDisplay'

function groupColor(group: AmalgameGroup | undefined) {
  if (!group) return null
  return GROUP_COLORS[group.colorIndex % GROUP_COLORS.length]
}

export function MultiProductSlotEditor() {
  const {
    products,
    activeProductIndex,
    productSlotResults,
    productTypes,
    plates,
    amalgameGroups,
    addProduct,
    removeProduct,
    setActiveProduct,
    updateProduct,
    handleCreateProductTypeForSlot,
  } = useCalculatorContext()

  const [plvDropdownOpen, setPlvDropdownOpen] = useState(false)

  const activeSlot = products[activeProductIndex]
  const activeResult = productSlotResults[activeProductIndex]
  const activeGroup = activeSlot?.amalgameGroupId
    ? amalgameGroups.find(g => g.id === activeSlot.amalgameGroupId)
    : undefined
  const isInImpressionGroup = activeGroup?.amalgameType === 'impression_decoupe'

  if (products.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-slate-500 mb-4">Aucun produit ajouté</p>
        <Button onClick={addProduct} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Onglets produits */}
      <div className="flex gap-2 flex-wrap items-center">
        {products.map((p, i) => {
          const group = p.amalgameGroupId ? amalgameGroups.find(g => g.id === p.amalgameGroupId) : undefined
          const c = group ? groupColor(group) : null
          return (
            <div key={p.id} className="flex items-center gap-1">
              <button
                onClick={() => setActiveProduct(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  i === activeProductIndex ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c && <span className={`w-2 h-2 rounded-full ${c.dot}`} />}
                {p.productSearch || `Produit ${i + 1}`}
              </button>
              {products.length > 1 && (
                <button onClick={() => removeProduct(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
        <button
          onClick={addProduct}
          className="px-3 py-2 rounded-lg text-sm border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Contenu du produit actif */}
      {activeSlot && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">

          {/* Infos de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label>Type de PLV</Label>
              <Input
                value={activeSlot.productSearch}
                onChange={(e) => {
                  updateProduct(activeProductIndex, 'productSearch', e.target.value)
                  updateProduct(activeProductIndex, 'productTypeId', '')
                  setPlvDropdownOpen(true)
                }}
                onFocus={() => setPlvDropdownOpen(true)}
                onBlur={() => setTimeout(() => setPlvDropdownOpen(false), 150)}
                placeholder="Rechercher..."
              />
              {plvDropdownOpen && (
                <div className="absolute z-10 w-full bg-white border shadow-lg mt-1 rounded max-h-40 overflow-auto">
                  {productTypes
                    .filter((pt) => pt.name.toLowerCase().includes(activeSlot.productSearch.toLowerCase()))
                    .map((pt) => (
                      <div key={pt.id} className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                        onMouseDown={() => {
                          updateProduct(activeProductIndex, 'productTypeId', pt.id.toString())
                          updateProduct(activeProductIndex, 'productSearch', pt.name)
                          setPlvDropdownOpen(false)
                        }}>
                        {pt.name}
                      </div>
                    ))}
                  {activeSlot.productSearch.trim() && !productTypes.some((pt) => pt.name.toLowerCase() === activeSlot.productSearch.toLowerCase()) && (
                    <div className="p-2 text-emerald-600 font-medium cursor-pointer border-t hover:bg-emerald-50 text-sm"
                      onMouseDown={() => {
                        handleCreateProductTypeForSlot(activeProductIndex, activeSlot.productSearch)
                        setPlvDropdownOpen(false)
                      }}>
                      + Créer &quot;{activeSlot.productSearch}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quantité</Label>
              <input type="number" min={1}
                value={activeSlot.quantity || ''}
                onChange={(e) => updateProduct(activeProductIndex, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="Ex: 500"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Format à plat (mm)</Label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min={1}
                  value={activeSlot.flatWidth || ''}
                  onChange={(e) => updateProduct(activeProductIndex, 'flatWidth', parseInt(e.target.value) || 0)}
                  placeholder="Largeur"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input type="number" min={1}
                  value={activeSlot.flatHeight || ''}
                  onChange={(e) => updateProduct(activeProductIndex, 'flatHeight', parseInt(e.target.value) || 0)}
                  placeholder="Hauteur"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            {!isInImpressionGroup && (
              <div className="space-y-2">
                <Label>Matière</Label>
                <select
                  value={activeSlot.selectedPlateId}
                  onChange={(e) => updateProduct(activeProductIndex, 'selectedPlateId', e.target.value)}
                  className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choisir une matière...</option>
                  {plates.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.name} — {p.cost.toFixed(2)}€/plaque
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Groupe amalgame ou impression/découpe individuelle */}
          {activeGroup ? (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${
              (() => { const c = groupColor(activeGroup); return c ? c.badge : 'bg-violet-50 text-violet-700 border-violet-200' })()
            }`}>
              <Layers className="h-4 w-4 flex-shrink-0" />
              <span>
                Impression et découpe gérées par <strong>{activeGroup.name}</strong>
                {activeGroup.cuttingTimePerPoseSeconds > 0 && (
                  <span className="font-normal opacity-60 ml-1.5">· {formatTimeSeconds(activeGroup.cuttingTimePerPoseSeconds)}/pose</span>
                )}
              </span>
            </div>
          ) : (
            <>
              {activeResult?.impositionResult && (
                <SlotImpositionDisplay
                  impositionResult={activeResult.impositionResult}
                  orientationOverride={activeSlot.orientationOverride}
                  onOrientationChange={(v) => updateProduct(activeProductIndex, 'orientationOverride', v)}
                  bordABord={activeSlot.bordABord}
                  onBordABordChange={(v) => updateProduct(activeProductIndex, 'bordABord', v)}
                  itemsPerPlateOverride={activeSlot.itemsPerPlateOverride}
                  onItemsPerPlateOverrideChange={(v) => updateProduct(activeProductIndex, 'itemsPerPlateOverride', v)}
                />
              )}

              {/* Impression individuelle */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Impression</h4>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`hasImpression-${activeProductIndex}`}
                      checked={activeSlot.hasImpression}
                      onChange={(e) => updateProduct(activeProductIndex, 'hasImpression', e.target.checked)}
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <Label htmlFor={`hasImpression-${activeProductIndex}`} className="text-sm cursor-pointer">Inclure</Label>
                  </div>
                </div>

                {activeSlot.hasImpression && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex gap-2 bg-white p-1 rounded-lg">
                      <button onClick={() => updateProduct(activeProductIndex, 'printMode', 'production')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.printMode === 'production' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Production</button>
                      <button onClick={() => updateProduct(activeProductIndex, 'printMode', 'quality')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.printMode === 'quality' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Qualité</button>
                    </div>

                    <div className="flex gap-2 bg-white p-1 rounded-lg">
                      <button onClick={() => { updateProduct(activeProductIndex, 'isRectoVerso', false); updateProduct(activeProductIndex, 'rectoVersoType', null) }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!activeSlot.isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Recto seul</button>
                      <button onClick={() => updateProduct(activeProductIndex, 'isRectoVerso', true)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Recto / Verso</button>
                    </div>

                    {activeSlot.isRectoVerso && (
                      <div className="flex gap-2 bg-white p-1 rounded-lg">
                        <button onClick={() => updateProduct(activeProductIndex, 'rectoVersoType', 'identical')}
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.rectoVersoType === 'identical' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Identique</button>
                        <button onClick={() => updateProduct(activeProductIndex, 'rectoVersoType', 'different')}
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.rectoVersoType === 'different' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Différent</button>
                      </div>
                    )}

                    {activeSlot.rectoVersoType === 'different' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <GaugeSlider label="Encre Recto (ml / plaque)" value={activeSlot.inkMlPerPlate} min={0} max={100} unit="ml"
                            onChange={(v) => updateProduct(activeProductIndex, 'inkMlPerPlate', v)} gradientColors="from-indigo-300 to-purple-600" />
                          <div className="flex gap-2">
                            {INK_SHORTCUTS.map((val) => (
                              <button key={val} onClick={() => updateProduct(activeProductIndex, 'inkMlPerPlate', val)}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeSlot.inkMlPerPlate === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val} ml</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <GaugeSlider label="Encre Verso (ml / plaque)" value={activeSlot.inkMlVerso} min={0} max={100} unit="ml"
                            onChange={(v) => updateProduct(activeProductIndex, 'inkMlVerso', v)} gradientColors="from-violet-300 to-fuchsia-600" />
                          <div className="flex gap-2">
                            {INK_SHORTCUTS.map((val) => (
                              <button key={val} onClick={() => updateProduct(activeProductIndex, 'inkMlVerso', val)}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeSlot.inkMlVerso === val ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val} ml</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <GaugeSlider label="Encre (ml / plaque)" value={activeSlot.inkMlPerPlate} min={0} max={100} unit="ml"
                          onChange={(v) => updateProduct(activeProductIndex, 'inkMlPerPlate', v)} gradientColors="from-indigo-300 to-purple-600" />
                        <div className="flex gap-2">
                          {INK_SHORTCUTS.map((val) => (
                            <button key={val} onClick={() => updateProduct(activeProductIndex, 'inkMlPerPlate', val)}
                              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeSlot.inkMlPerPlate === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val} ml</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs text-purple-800">Finitions</Label>
                      <div className="flex gap-2">
                        <button onClick={() => updateProduct(activeProductIndex, 'hasVarnish', !activeSlot.hasVarnish)}
                          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${activeSlot.hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Vernis</button>
                        <button onClick={() => updateProduct(activeProductIndex, 'hasFlatColor', !activeSlot.hasFlatColor)}
                          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${activeSlot.hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Blanc</button>
                      </div>
                      {activeSlot.hasVarnish && (
                        <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                          <GaugeSlider label="Surface Vernis" value={activeSlot.varnishSurfacePercent} min={0} max={100} unit="%"
                            onChange={(v) => updateProduct(activeProductIndex, 'varnishSurfacePercent', v)} gradientColors="from-purple-200 to-purple-500" />
                          <div className="flex gap-2">
                            {FINISHING_SHORTCUTS.map((val) => (
                              <button key={val} onClick={() => updateProduct(activeProductIndex, 'varnishSurfacePercent', val)}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeSlot.varnishSurfacePercent === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val}%</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeSlot.hasFlatColor && (
                        <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                          <GaugeSlider label="Surface Aplat" value={activeSlot.flatColorSurfacePercent} min={0} max={100} unit="%"
                            onChange={(v) => updateProduct(activeProductIndex, 'flatColorSurfacePercent', v)} gradientColors="from-violet-200 to-violet-500" />
                          <div className="flex gap-2">
                            {FINISHING_SHORTCUTS.map((val) => (
                              <button key={val} onClick={() => updateProduct(activeProductIndex, 'flatColorSurfacePercent', val)}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeSlot.flatColorSurfacePercent === val ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{val}%</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-900 font-medium text-xs">Calage impression</Label>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {(['none', 'standard', 'complexe'] as const).map((type) => (
                          <button key={type} onClick={() => updateProduct(activeProductIndex, 'printSetupType', type)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              activeSlot.printSetupType === type
                                ? type === 'none' ? 'bg-white text-slate-700 shadow-sm' : type === 'standard' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-red-700 shadow-sm'
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}>
                            {type === 'none' ? 'Aucun' : type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 bg-purple-100/60 p-2 rounded-lg border border-purple-200">
                      <Label className="text-purple-900 font-medium text-xs">Temps machine impression</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} step={0.5}
                          value={activeSlot.machineTimeMinOverride ?? ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            updateProduct(activeProductIndex, 'machineTimeMinOverride', isNaN(v) || e.target.value === '' ? null : v)
                          }}
                          placeholder="Forcer le temps (min)…"
                          className="flex-1 h-8 px-2 text-xs border border-purple-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                        {activeSlot.machineTimeMinOverride != null && (
                          <button type="button" onClick={() => updateProduct(activeProductIndex, 'machineTimeMinOverride', null)}
                            className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded border border-slate-200 bg-white transition-colors">
                            Auto
                          </button>
                        )}
                      </div>
                      {activeResult && (
                        <div className="text-xs text-purple-700 font-medium">
                          {activeSlot.machineTimeMinOverride != null
                            ? `Forcé : ${activeSlot.machineTimeMinOverride} min`
                            : `Calculé : ${Math.round(activeResult.costResult.printingCostData.machineTimeMin)} min`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Découpe individuelle */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700">Découpe</h4>
                <div className="space-y-2">
                  <GaugeSlider label="Temps par pose" value={activeSlot.cuttingTimePerPoseSeconds} min={0} max={300} unit="sec"
                    onChange={(v) => updateProduct(activeProductIndex, 'cuttingTimePerPoseSeconds', v)}
                    formatValue={formatTimeSeconds} gradientColors="from-yellow-300 to-orange-600" />
                  <div className="flex gap-2">
                    {CUTTING_SHORTCUTS.map((val) => (
                      <button key={val} onClick={() => updateProduct(activeProductIndex, 'cuttingTimePerPoseSeconds', val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeSlot.cuttingTimePerPoseSeconds === val ? 'bg-orange-500 text-white border-orange-500' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                        {val === 0 ? '0s' : formatTimeSeconds(val)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-900 font-medium text-xs">Calage découpe</Label>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['none', 'standard', 'complexe'] as const).map((type) => (
                      <button key={type} onClick={() => updateProduct(activeProductIndex, 'cuttingSetupType', type)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          activeSlot.cuttingSetupType === type
                            ? type === 'none' ? 'bg-white text-slate-700 shadow-sm' : type === 'standard' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-red-700 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}>
                        {type === 'none' ? 'Aucun' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {activeResult && activeResult.costResult.cuttingMachineTimeMin > 0 && (
                  <div className="flex justify-between items-center bg-orange-50 p-2 rounded text-xs text-orange-800">
                    <span>Temps machine :</span>
                    <span className="font-bold">{Math.round(activeResult.costResult.cuttingMachineTimeMin)} min</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
