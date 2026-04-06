'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { GaugeSlider } from '@/components/GaugeSlider'
import { Trash2, Plus } from 'lucide-react'
import { useCalculatorContext } from '../context/CalculatorContext'
import { formatTimeSeconds } from '@/lib/format'
import type { ProductSlot } from '@/types/calculator'

const INK_SHORTCUTS = [10, 25, 50, 75]
const FINISHING_SHORTCUTS = [10, 25, 50, 75]
const CUTTING_SHORTCUTS = [0, 20, 60, 120]

export function SectionMultiProduct() {
  const {
    products,
    activeProductIndex,
    productSlotResults,
    productTypes,
    plates,
    addProduct,
    removeProduct,
    setActiveProduct,
    updateProduct,
  } = useCalculatorContext()

  const activeSlot: ProductSlot | undefined = products[activeProductIndex]
  const activeResult = productSlotResults[activeProductIndex]

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
    <div className="space-y-4">

      {/* ── Onglets produits ── */}
      <div className="flex gap-2 flex-wrap items-center">
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveProduct(i)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                i === activeProductIndex
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.productSearch || `Produit ${i + 1}`}
            </button>
            {products.length > 1 && (
              <button
                onClick={() => removeProduct(i)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addProduct}
          className="px-3 py-2 rounded-lg text-sm border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* ── Contenu du produit actif ── */}
      {activeSlot && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">

          {/* Infos de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de PLV</Label>
              <select
                value={activeSlot.productTypeId}
                onChange={(e) => {
                  const pt = productTypes.find((p) => p.id.toString() === e.target.value)
                  updateProduct(activeProductIndex, 'productTypeId', e.target.value)
                  updateProduct(activeProductIndex, 'productSearch', pt?.name || '')
                }}
                className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Choisir un type de PLV...</option>
                {productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id.toString()}>{pt.name}</option>
                ))}
              </select>
            </div>

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

            <div className="space-y-2">
              <Label>Quantité</Label>
              <input
                type="number"
                min={1}
                value={activeSlot.quantity || ''}
                onChange={(e) => updateProduct(activeProductIndex, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="Ex: 500"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Format à plat (mm)</Label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={activeSlot.flatWidth || ''}
                  onChange={(e) => updateProduct(activeProductIndex, 'flatWidth', parseInt(e.target.value) || 0)}
                  placeholder="Largeur"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={activeSlot.flatHeight || ''}
                  onChange={(e) => updateProduct(activeProductIndex, 'flatHeight', parseInt(e.target.value) || 0)}
                  placeholder="Hauteur"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Résultat imposition */}
          {activeResult?.impositionResult && (
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{activeResult.impositionResult.itemsPerPlate}</div>
                <div className="text-xs text-blue-400 uppercase">Poses / Plaque</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600">{activeResult.impositionResult.orientation}</div>
                <div className="text-xs text-slate-400">Orientation</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-700">{activeResult.impositionResult.platesNeeded}</div>
                <div className="text-xs text-slate-400 uppercase">Plaques nécessaires</div>
              </div>
            </div>
          )}

          {/* ── Impression ── */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Impression</h4>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`hasImpression-${activeProductIndex}`}
                  checked={activeSlot.hasImpression}
                  onChange={(e) => updateProduct(activeProductIndex, 'hasImpression', e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                <Label htmlFor={`hasImpression-${activeProductIndex}`} className="text-sm cursor-pointer">Inclure</Label>
              </div>
            </div>

            {activeSlot.hasImpression && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                {/* Mode impression */}
                <div className="flex gap-2 bg-white p-1 rounded-lg">
                  <button
                    onClick={() => updateProduct(activeProductIndex, 'printMode', 'production')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.printMode === 'production' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Production
                  </button>
                  <button
                    onClick={() => updateProduct(activeProductIndex, 'printMode', 'quality')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.printMode === 'quality' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Qualité
                  </button>
                </div>

                {/* Recto/Verso */}
                <div className="flex gap-2 bg-white p-1 rounded-lg">
                  <button
                    onClick={() => { updateProduct(activeProductIndex, 'isRectoVerso', false); updateProduct(activeProductIndex, 'rectoVersoType', null) }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!activeSlot.isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Recto seul
                  </button>
                  <button
                    onClick={() => updateProduct(activeProductIndex, 'isRectoVerso', true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Recto / Verso
                  </button>
                </div>

                {activeSlot.isRectoVerso && (
                  <div className="flex gap-2 bg-white p-1 rounded-lg">
                    <button
                      onClick={() => updateProduct(activeProductIndex, 'rectoVersoType', 'identical')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.rectoVersoType === 'identical' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Identique
                    </button>
                    <button
                      onClick={() => updateProduct(activeProductIndex, 'rectoVersoType', 'different')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeSlot.rectoVersoType === 'different' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Différent
                    </button>
                  </div>
                )}

                {/* Encre */}
                <div className="space-y-2">
                  <GaugeSlider
                    label="Encre (ml / plaque)"
                    value={activeSlot.inkMlPerPlate}
                    min={0}
                    max={100}
                    unit="ml"
                    onChange={(v) => updateProduct(activeProductIndex, 'inkMlPerPlate', v)}
                    gradientColors="from-indigo-300 to-purple-600"
                  />
                  <div className="flex gap-2">
                    {INK_SHORTCUTS.map((val) => (
                      <button
                        key={val}
                        onClick={() => updateProduct(activeProductIndex, 'inkMlPerPlate', val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          activeSlot.inkMlPerPlate === val
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {val} ml
                      </button>
                    ))}
                  </div>
                </div>

                {/* Finitions */}
                <div className="space-y-2">
                  <Label className="text-xs text-purple-800">Finitions</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateProduct(activeProductIndex, 'hasVarnish', !activeSlot.hasVarnish)}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${activeSlot.hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Vernis
                    </button>
                    <button
                      onClick={() => updateProduct(activeProductIndex, 'hasFlatColor', !activeSlot.hasFlatColor)}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${activeSlot.hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Blanc
                    </button>
                  </div>

                  {activeSlot.hasVarnish && (
                    <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                      <GaugeSlider
                        label="Surface Vernis"
                        value={activeSlot.varnishSurfacePercent}
                        min={0}
                        max={100}
                        unit="%"
                        onChange={(v) => updateProduct(activeProductIndex, 'varnishSurfacePercent', v)}
                        gradientColors="from-purple-200 to-purple-500"
                      />
                      <div className="flex gap-2">
                        {FINISHING_SHORTCUTS.map((val) => (
                          <button
                            key={val}
                            onClick={() => updateProduct(activeProductIndex, 'varnishSurfacePercent', val)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              activeSlot.varnishSurfacePercent === val
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

                  {activeSlot.hasFlatColor && (
                    <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                      <GaugeSlider
                        label="Surface Aplat"
                        value={activeSlot.flatColorSurfacePercent}
                        min={0}
                        max={100}
                        unit="%"
                        onChange={(v) => updateProduct(activeProductIndex, 'flatColorSurfacePercent', v)}
                        gradientColors="from-violet-200 to-violet-500"
                      />
                      <div className="flex gap-2">
                        {FINISHING_SHORTCUTS.map((val) => (
                          <button
                            key={val}
                            onClick={() => updateProduct(activeProductIndex, 'flatColorSurfacePercent', val)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              activeSlot.flatColorSurfacePercent === val
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
                </div>

                {/* Calage impression */}
                <div className="space-y-2">
                  <Label className="text-purple-900 font-medium text-xs">Calage impression</Label>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['none', 'standard', 'complexe'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateProduct(activeProductIndex, 'printSetupType', type)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          activeSlot.printSetupType === type
                            ? type === 'none' ? 'bg-white text-slate-700 shadow-sm'
                              : type === 'standard' ? 'bg-white text-amber-700 shadow-sm'
                              : 'bg-white text-red-700 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {type === 'none' ? 'Aucun' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temps machine */}
                {activeResult && (
                  <div className="flex justify-between items-center bg-white p-2 rounded text-xs text-purple-800">
                    <span>Temps machine :</span>
                    <span className="font-bold">{Math.round(activeResult.costResult.printingCostData.machineTimeMin)} min</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Découpe ── */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700">Découpe</h4>
            <div className="space-y-2">
              <GaugeSlider
                label="Temps par pose"
                value={activeSlot.cuttingTimePerPoseSeconds}
                min={0}
                max={300}
                unit="sec"
                onChange={(v) => updateProduct(activeProductIndex, 'cuttingTimePerPoseSeconds', v)}
                formatValue={formatTimeSeconds}
                gradientColors="from-yellow-300 to-orange-600"
              />
              <div className="flex gap-2">
                {CUTTING_SHORTCUTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => updateProduct(activeProductIndex, 'cuttingTimePerPoseSeconds', val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      activeSlot.cuttingTimePerPoseSeconds === val
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {val === 0 ? '0s' : formatTimeSeconds(val)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-orange-900 font-medium text-xs">Calage découpe</Label>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {(['none', 'standard', 'complexe'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateProduct(activeProductIndex, 'cuttingSetupType', type)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      activeSlot.cuttingSetupType === type
                        ? type === 'none' ? 'bg-white text-slate-700 shadow-sm'
                          : type === 'standard' ? 'bg-white text-amber-700 shadow-sm'
                          : 'bg-white text-red-700 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'none' ? 'Aucun' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sous-total produit ── */}
          {activeResult && (
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-lg mt-4">
              <span className="font-medium">Sous-total {activeSlot.productSearch || `Produit ${activeProductIndex + 1}`}</span>
              <span className="font-bold text-lg text-emerald-400">{activeResult.costResult.subtotal.toFixed(2)} €</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}