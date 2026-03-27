import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionPresentation() {
  const {
    studyNumber, setStudyNumber,
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
  } = useCalculatorContext()

  const handleToggleMultiProduct = (enabled: boolean) => {
    setIsMultiProduct(enabled)
    if (enabled && products.length === 0) {
      addProduct()
    }
  }

  return (
    <SectionDisplay number="1" title="Présentation & Matière" color="emerald">

      {/* ── Numéro de dossier ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Numéro de Dossier</Label>
          <Input
            value={studyNumber}
            onChange={(e) => setStudyNumber(e.target.value)}
            placeholder="Ex: ET-2024-001"
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
              <Select value={selectedPlateId} onValueChange={setSelectedPlateId}>
                <SelectTrigger className="w-full truncate">
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

      {/* ── Toggle multi-produits ── */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isMultiProduct
          ? 'bg-emerald-50 border-emerald-200 mt-4'
          : 'bg-slate-50 border-slate-200 mt-4'
      }`}>
        <button
          onClick={() => handleToggleMultiProduct(!isMultiProduct)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isMultiProduct ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
            isMultiProduct ? 'left-5' : 'left-0.5'
          }`} />
        </button>
        <div>
          <span className={`text-sm font-semibold ${isMultiProduct ? 'text-emerald-800' : 'text-slate-600'}`}>
            Devis multi-produits
          </span>
          <p className="text-xs text-slate-400">
            {isMultiProduct
              ? 'Chaque produit a sa propre impression et découpe'
              : 'Activer pour ajouter plusieurs types de PLV'}
          </p>
        </div>
        {isMultiProduct && (
          <span className="ml-auto text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

    </SectionDisplay>
  )
}
