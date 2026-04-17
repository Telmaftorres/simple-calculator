import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { Pencil, X, LayoutTemplate } from 'lucide-react'

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
    addProduct,
    products,
    hasDossierFee, setHasDossierFee,
    applyTemplate,
  } = useCalculatorContext()

  const [showOverrideInput, setShowOverrideInput] = useState(formState.plateCostOverride !== null)

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
            Frais de dossier 8 €
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

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Matière</Label>
              <div className="flex gap-2 items-start">
                <Select value={selectedPlateId} onValueChange={(v) => {
                  setSelectedPlateId(v)
                  // Réinitialiser l'override si on change de matière
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
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (showOverrideInput) {
                          setField('plateCostOverride', null)
                        }
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
