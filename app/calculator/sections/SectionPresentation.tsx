import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { Pencil, X, LayoutTemplate, FlaskConical, Minus, Plus } from 'lucide-react'

export function SectionPresentation() {
  const {
    studyNumber, setStudyNumber,
    formState, setField,
    productSearch, setProductSearch,
    isProductDropdownOpen, setIsProductDropdownOpen,
    productTypes, setSelectedProductTypeId,
    handleCreateProductType,
    quantity, setQuantity,
    selectedPlateId, setSelectedPlateId,
    plates,
    flatWidth, setFlatWidth,
    flatHeight, setFlatHeight,
    isMultiProduct, setIsMultiProduct,
    plvQuantity, setPlvQuantity,
    addProduct,
    products,
    hasDossierFee, setHasDossierFee,
    modePrototype, setModePrototype,
    applyTemplate,
    customPlate, setCustomPlate,
    templateOptionSelections, setTemplateOptionSelections, templateOptionsCost,
  } = useCalculatorContext()

  const [showOverrideInput, setShowOverrideInput] = useState(formState.plateCostOverride !== null)
  const isCustomPlateMode = customPlate !== null

  const selectedPlateBase = plates.find((p) => p.id.toString() === selectedPlateId)
  const catalogCost = selectedPlateBase?.cost

  const selectedProductType = productTypes.find(
    (pt) => pt.id.toString() === formState.selectedProductTypeId
  )
  const availableTemplates = selectedProductType?.templates ?? []

  const handleToggleMultiProduct = (enabled: boolean) => {
    setIsMultiProduct(enabled)
    if (enabled && products.length === 0) {
      addProduct()
    }
  }

  return (
    <SectionDisplay
      number="1"
      title="Présentation & Matière"
      color="emerald"
      headerButtons={
        <>
          <button
            onClick={() => handleToggleMultiProduct(!isMultiProduct)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isMultiProduct
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            Multi-produits{isMultiProduct ? ` (${products.length})` : ''}
          </button>
          <button
            onClick={() => setHasDossierFee(!hasDossierFee)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              hasDossierFee
                ? 'bg-slate-700 text-white border-slate-700'
                : 'border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            Frais de dossier 15 €
          </button>
          <button
            onClick={() => setModePrototype(!modePrototype)}
            title="Forfait BE+dossier bloqué à 25 €, fournitures à 10 €"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              modePrototype
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-amber-300 text-amber-600 hover:border-amber-400'
            }`}
          >
            🧪 Mode Prototype
          </button>
        </>
      }
    >

      {/* ── Numéro de dossier + Client ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Numéro de Dossier</Label>
          <Input
            value={studyNumber}
            onChange={(e) => setStudyNumber(e.target.value)}
            placeholder="Ex: ET-2024-001"
          />
        </div>
        <div className="space-y-2">
          <Label>Client</Label>
          <Input
            value={formState.client ?? ''}
            onChange={(e) => setField('client', e.target.value)}
            placeholder="Nom du client"
          />
        </div>
        {/* ── Nom du type PLV — affiché en lecture seule en mode multi ── */}
        {isMultiProduct && productSearch && (
          <div className="space-y-2">
            <Label>Type de PLV</Label>
            <div className="flex h-10 items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
              {productSearch}
            </div>
          </div>
        )}

        {/* ── Nombre de PLV — visible uniquement en mode multi ── */}
        {isMultiProduct && (
          <div className="space-y-2">
            <Label>Nombre de PLV</Label>
            <Input
              type="number"
              min={1}
              value={plvQuantity ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                setPlvQuantity(isNaN(v) || e.target.value === '' ? null : v)
              }}
              placeholder="Ex : 140"
            />
            <p className="text-xs text-slate-400">Base pour façonnage, conditionnement et transport</p>
          </div>
        )}

        {/* ── Type de PLV — masqué en mode multi ── */}
        {!isMultiProduct && (
          <>
            <div className="space-y-2 relative">
              <Label>Type de PLV</Label>
              <Input
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setIsProductDropdownOpen(true) }}
                onFocus={() => setIsProductDropdownOpen(true)}
                placeholder="Rechercher..."
              />
              {isProductDropdownOpen && (
                <div className="absolute z-10 w-full bg-white border shadow-lg mt-1 rounded max-h-40 overflow-auto">
                  {productTypes
                    .filter((pt) => pt.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((pt) => (
                      <div
                        key={pt.id}
                        className="p-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => {
                          setSelectedProductTypeId(pt.id.toString())
                          setProductSearch(pt.name)
                          setIsProductDropdownOpen(false)
                        }}
                      >
                        {pt.name}
                      </div>
                    ))}
                  {productSearch.trim() && !productTypes.some((pt) => pt.name.toLowerCase() === productSearch.toLowerCase()) && (
                    <div
                      className="p-2 text-emerald-600 font-medium cursor-pointer border-t hover:bg-emerald-50"
                      onClick={handleCreateProductType}
                    >
                      + Créer &quot;{productSearch}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {availableTemplates.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1.5 text-emerald-700">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Modèle standard
                </Label>
                <Select
                  value=""
                  onValueChange={(v) => {
                    const tpl = availableTemplates.find((t) => t.id.toString() === v)
                    if (tpl) applyTemplate(tpl)
                  }}
                >
                  <SelectTrigger className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    <SelectValue placeholder="Choisir un modèle (optionnel)…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id.toString()}>
                        {tpl.name}
                        {tpl.flatWidth && tpl.flatHeight ? ` — ${tpl.flatWidth}×${tpl.flatHeight} mm` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Pré-remplit le format, la matière, la découpe et le façonnage. Vous pouvez ensuite modifier chaque valeur.</p>
              </div>
            )}

            {templateOptionSelections.length > 0 && (
              <div className="md:col-span-2 rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sky-700 font-semibold">Options du modèle</Label>
                  <span className="text-xs font-semibold text-sky-700 bg-sky-100 border border-sky-200 rounded px-2 py-0.5">
                    + {templateOptionsCost.toFixed(2)} €
                  </span>
                </div>
                <div className="space-y-2">
                  {templateOptionSelections.map((sel) => (
                    <div key={sel.variantId} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{sel.label}</p>
                        <p className="text-xs text-slate-400">{sel.optionName} — {sel.priceHT.toFixed(2)} €/unité</p>
                      </div>
                      {sel.inputType === 'multi_item' ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setTemplateOptionSelections(templateOptionSelections.map((s) =>
                              s.variantId === sel.variantId ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s
                            ))}
                            className="h-7 w-7 rounded border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                            disabled={sel.quantity <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-700">{sel.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setTemplateOptionSelections(templateOptionSelections.map((s) =>
                              s.variantId === sel.variantId ? { ...s, quantity: s.quantity + 1 } : s
                            ))}
                            className="h-7 w-7 rounded border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 shrink-0">× {sel.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Matière</Label>
                <button
                  type="button"
                  onClick={() => {
                    if (isCustomPlateMode) {
                      setCustomPlate(null)
                    } else {
                      setCustomPlate({ name: '', width: 0, height: 0, cost: 0 })
                      setSelectedPlateId('')
                      setField('plateCostOverride', null)
                      setShowOverrideInput(false)
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    isCustomPlateMode
                      ? 'bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200'
                      : 'border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-600'
                  }`}
                  title={isCustomPlateMode ? 'Revenir au catalogue' : 'Saisir une matière personnalisée (test fournisseur)'}
                >
                  <FlaskConical className="h-3 w-3" />
                  {isCustomPlateMode ? 'Matière personnalisée ✕' : 'Test fournisseur'}
                </button>
              </div>

              {isCustomPlateMode ? (
                /* ── Mode matière personnalisée ── */
                <div className="space-y-2 bg-violet-50 border border-violet-200 rounded-lg p-3">
                  <p className="text-xs text-violet-600 font-medium">Matière temporaire — non enregistrée dans le catalogue</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-violet-700">Nom du fournisseur / matière</Label>
                      <Input
                        value={customPlate?.name ?? ''}
                        onChange={(e) => setCustomPlate({ ...customPlate!, name: e.target.value })}
                        placeholder="Ex: Fournisseur X — BC 30 1700x2100"
                        className="border-violet-300 focus:border-violet-500 bg-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-violet-700">Largeur (mm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={customPlate?.width || ''}
                        onChange={(e) => setCustomPlate({ ...customPlate!, width: parseInt(e.target.value) || 0 })}
                        placeholder="1700"
                        className="border-violet-300 bg-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-violet-700">Hauteur (mm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={customPlate?.height || ''}
                        onChange={(e) => setCustomPlate({ ...customPlate!, height: parseInt(e.target.value) || 0 })}
                        placeholder="2100"
                        className="border-violet-300 bg-white text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-violet-700">Prix par plaque (€)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={customPlate?.cost || ''}
                          onChange={(e) => setCustomPlate({ ...customPlate!, cost: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="pr-8 border-violet-300 bg-white text-sm"
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-violet-400">€</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Mode catalogue normal ── */
                <>
                  <div className="flex gap-2 items-start">
                    <Select value={selectedPlateId} onValueChange={(v) => {
                      setSelectedPlateId(v)
                      setField('plateCostOverride', null)
                      setShowOverrideInput(false)
                    }}>
                      <SelectTrigger className="flex-1 truncate">
                        <SelectValue placeholder="Choisir une plaque..." />
                      </SelectTrigger>
                      <SelectContent>
                        {plates.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name} ({p.width}x{p.height})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {catalogCost !== undefined && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex flex-col items-end">
                          {formState.plateCostOverride !== null ? (
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 whitespace-nowrap">
                              {formState.plateCostOverride.toFixed(2)} €/pl.
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 whitespace-nowrap">
                              {catalogCost.toFixed(2)} €/pl.
                            </span>
                          )}
                          {selectedPlateBase?.stockRemaining !== undefined && (
                            <span className={`mt-0.5 text-[10px] font-medium whitespace-nowrap ${selectedPlateBase.stockRemaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {selectedPlateBase.stockRemaining > 0 ? `${selectedPlateBase.stockRemaining} en stock` : 'rupture de stock'}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (showOverrideInput) setField('plateCostOverride', null)
                            setShowOverrideInput(!showOverrideInput)
                          }}
                          title={showOverrideInput ? 'Annuler le prix négocié' : 'Saisir un prix négocié'}
                          className={`p-1.5 rounded border transition-colors ${
                            showOverrideInput
                              ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300'
                          }`}
                        >
                          {showOverrideInput ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {showOverrideInput && catalogCost !== undefined && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-amber-700 font-medium whitespace-nowrap">Prix négocié :</span>
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={formState.plateCostOverride ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            setField('plateCostOverride', isNaN(val) ? null : val)
                          }}
                          placeholder={catalogCost.toFixed(2)}
                          className="pr-8 text-amber-900 border-amber-300 bg-white h-8 text-sm"
                        />
                        <span className="absolute right-2.5 top-1.5 text-xs text-amber-500">€</span>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">catalogue : {catalogCost.toFixed(2)} €</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Format à plat — masqué en mode multi ── */}
      {!isMultiProduct && (
        <div className="mt-4 pt-4 border-t">
          <Label className="mb-2 block text-emerald-700">Format à Plat (mm)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={flatWidth || ''}
                onChange={(e) => setFlatWidth(parseInt(e.target.value) || 0)}
                placeholder="Largeur"
              />
              <span className="text-xs text-slate-500">L</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={flatHeight || ''}
                onChange={(e) => setFlatHeight(parseInt(e.target.value) || 0)}
                placeholder="Hauteur"
              />
              <span className="text-xs text-slate-500">H</span>
            </div>
          </div>
        </div>
      )}

    </SectionDisplay>
  )
}
