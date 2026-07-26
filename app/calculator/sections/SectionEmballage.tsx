'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { SectionDisplay } from '../shared'
import { formatTimeSeconds } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'
import { CUTTING_SHORTCUTS } from '@/lib/config/ui'
import { ShortcutButtons } from '@/components/calculator/ShortcutButtons'

type BoxType = 'etui' | 'caisse' | 'plaque_rainee'
type MaterialType = 'B' | 'EB' | 'C' | 'BC'
type ExternalSize = 'petit' | 'moyen' | 'grand'

const BOX_TYPES: { id: BoxType; label: string }[] = [
  { id: 'etui', label: 'Étui' },
  { id: 'caisse', label: 'Caisse' },
  { id: 'plaque_rainee', label: 'Plaque rainée' },
]

const MATERIAL_TYPES: { id: MaterialType; label: string; external: boolean }[] = [
  { id: 'B', label: 'B', external: true },
  { id: 'EB', label: 'EB', external: true },
  { id: 'C', label: 'C', external: false },
  { id: 'BC', label: 'BC', external: false },
]

const EXTERNAL_SIZES: { id: ExternalSize; label: string }[] = [
  { id: 'petit', label: 'Petit' },
  { id: 'moyen', label: 'Moyen' },
  { id: 'grand', label: 'Grand' },
]

export function SectionEmballage() {
  const {
    hasPackaging, setHasPackaging,
    hasFournituresEmb, setHasFournituresEmb,
    packagingBoxType, setPackagingBoxType,
    packagingMaterialType, setPackagingMaterialType,
    packagingExternalSize, setPackagingExternalSize,
    packagingProductLength, setPackagingProductLength,
    packagingProductWidth, setPackagingProductWidth,
    packagingProductHeight, setPackagingProductHeight,
    packagingProductThickness, setPackagingProductThickness,
    packagingPlateId, setPackagingPlateId,
    packagingQuantity, setPackagingQuantity,
    packagingCuttingTimePerPoseSeconds, setPackagingCuttingTimePerPoseSeconds,
    packagingUnitPriceOverride, setPackagingUnitPriceOverride,
    packagingMargePercent, setPackagingMargePercent,
    computedPackagingDimensions,
    largestProduct,
    isMultiProduct,
    flatWidth, flatHeight,
    plates,
    costResult,
  } = useCalculatorContext()

  const {
    packagingMaterialCost,
    packagingCuttingCost,
    packagingTotalCost,
    packagingItemsPerPlate,
    packagingPlatesNeeded,
    packagingExternalUnitPrice,
    effectivePackagingUnitPrice,
  } = costResult

  const isExternal = packagingMaterialType === 'B' || packagingMaterialType === 'EB'

  // Plaques C/BC pour le sélecteur
  const packagingPlates = plates.filter((p) => {
    const m = p.material.toLowerCase()
    if (packagingMaterialType === 'C') {
      return m === 'c' || m.startsWith('c ') || m.startsWith('c(') || m.includes('cannelure')
    }
    if (packagingMaterialType === 'BC') {
      return m.startsWith('bc') || m.includes('bc')
    }
    return m.startsWith('bc') || m === 'c' || m.startsWith('c ') || m.startsWith('c(') || m.includes('carton')
  })

  // Auto-remplir depuis le produit courant / plus grand
  const handleAutoFill = () => {
    if (isMultiProduct && largestProduct) {
      setPackagingProductLength(largestProduct.flatHeight)
      setPackagingProductWidth(largestProduct.flatWidth)
    } else {
      setPackagingProductLength(flatHeight)
      setPackagingProductWidth(flatWidth)
    }
  }

  const { width: computedW, height: computedH } = computedPackagingDimensions

  return (
    <SectionDisplay
      number="9"
      title="Emballage"
      color="amber"
      enabled={hasPackaging}
      onToggle={setHasPackaging}
      headerButtons={
        <button
          onClick={() => setHasFournituresEmb(!hasFournituresEmb)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            hasFournituresEmb
              ? 'bg-slate-700 text-white border-slate-700'
              : 'border-slate-300 text-slate-500 hover:border-slate-400'
          }`}
        >
          Fournitures emb. 15 €
        </button>
      }
    >
      <div className="space-y-5">

        {/* ── Type de boîte ── */}
        <div className="space-y-2">
          <Label className="text-amber-900 font-medium">Type d&apos;emballage</Label>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
            {BOX_TYPES.map((bt) => (
              <button
                key={bt.id}
                onClick={() => setPackagingBoxType(bt.id)}
                className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  packagingBoxType === bt.id
                    ? 'bg-white shadow-sm text-amber-700 ring-1 ring-amber-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Matière ── */}
        <div className="space-y-2">
          <Label className="text-amber-900 font-medium">Matière</Label>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
            {MATERIAL_TYPES.map((mt) => (
              <button
                key={mt.id}
                onClick={() => {
                  setPackagingMaterialType(mt.id)
                  if (!mt.external) setPackagingExternalSize(null)
                }}
                className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  packagingMaterialType === mt.id
                    ? 'bg-white shadow-sm text-amber-700 ring-1 ring-amber-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mt.id}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 italic">
            {isExternal ? 'B / EB — fournisseur externe, prix unitaire fixe' : 'C / BC — carton produit en interne, calcul par plaque'}
          </p>
        </div>

        {/* ══════════ B / EB ══════════ */}
        {isExternal && (
          <div className="space-y-4">

            {/* Format */}
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-2">
                {EXTERNAL_SIZES.map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setPackagingExternalSize(sz.id)}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
                      packagingExternalSize === sz.id
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantité */}
            <div className="space-y-2">
              <Label>Quantité d&apos;emballages</Label>
              <input
                type="number" min={1}
                value={packagingQuantity || ''}
                onChange={(e) => setPackagingQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ex : 500"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            {/* Récap B/EB */}
            {packagingExternalSize && packagingQuantity > 0 && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Prix catalogue {packagingMaterialType} {packagingExternalSize}</span>
                  <span className="font-medium">
                    {packagingExternalUnitPrice === 0
                      ? <span className="text-amber-600 italic">Non configuré</span>
                      : `${packagingExternalUnitPrice.toFixed(4)} €/pce`}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Prix réel / pce</span>
                    {packagingUnitPriceOverride != null && (
                      <button
                        type="button"
                        onClick={() => setPackagingUnitPriceOverride(null)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={packagingUnitPriceOverride ?? ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setPackagingUnitPriceOverride(isNaN(v) || e.target.value === '' ? null : v)
                    }}
                    placeholder={`Catalogue : ${packagingExternalUnitPrice.toFixed(4)} €/pce`}
                    className="flex h-8 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Quantité</span>
                  <span className="font-medium">{packagingQuantity} pce(s)</span>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-2 font-bold text-amber-800">
                  <span>Total Emballage</span>
                  <span>
                    {packagingTotalCost.toFixed(2)} €
                    {packagingUnitPriceOverride != null && (
                      <span className="ml-1 text-xs font-normal text-amber-600">
                        ({effectivePackagingUnitPrice.toFixed(4)} €/pce)
                      </span>
                    )}
                  </span>
                </div>
                {packagingExternalUnitPrice === 0 && packagingUnitPriceOverride == null && (
                  <p className="text-xs text-amber-600 italic">
                    ⚠ Prix non configuré — à renseigner dans les Paramètres calculateur
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════ C / BC ══════════ */}
        {!isExternal && (
          <div className="space-y-4">

            {/* Dimensions produit fini */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Dimensions du produit fini</Label>
                <button
                  onClick={handleAutoFill}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium underline"
                >
                  {isMultiProduct ? '↑ Auto depuis plus grand produit' : '↑ Auto depuis le produit'}
                </button>
              </div>
              {isMultiProduct && largestProduct && (
                <p className="text-xs text-slate-400 italic">
                  Plus grand produit : {largestProduct.flatWidth} × {largestProduct.flatHeight} mm
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Longueur (mm)</Label>
                  <input
                    type="number" min={1}
                    value={packagingProductLength || ''}
                    onChange={(e) => setPackagingProductLength(parseInt(e.target.value) || 0)}
                    placeholder="ex: 210"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Largeur (mm)</Label>
                  <input
                    type="number" min={1}
                    value={packagingProductWidth || ''}
                    onChange={(e) => setPackagingProductWidth(parseInt(e.target.value) || 0)}
                    placeholder="ex: 148"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                {packagingBoxType === 'etui' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Épaisseur (mm)</Label>
                    <input
                      type="number" min={0}
                      value={packagingProductThickness || ''}
                      onChange={(e) => setPackagingProductThickness(parseInt(e.target.value) || 0)}
                      placeholder="ex: 5"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}
                {packagingBoxType === 'caisse' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Hauteur (mm)</Label>
                    <input
                      type="number" min={0}
                      value={packagingProductHeight || ''}
                      onChange={(e) => setPackagingProductHeight(parseInt(e.target.value) || 0)}
                      placeholder="ex: 30"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Format carton calculé */}
            {computedW > 0 && computedH > 0 ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <div className="text-xs text-amber-600 uppercase font-semibold">Format carton calculé</div>
                <div className="font-bold text-amber-800 text-sm">{computedW} × {computedH} mm</div>
              </div>
            ) : (
              packagingProductLength > 0 || packagingProductWidth > 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-2 border">
                  {packagingBoxType === 'caisse' && packagingProductHeight <= 0
                    ? 'Renseignez la hauteur du produit pour calculer le format'
                    : 'Renseignez les dimensions du produit pour calculer le format'}
                </div>
              ) : null
            )}

            {/* Matière d'emballage (plaque C/BC) */}
            <div className="space-y-2">
              <Label>Matière d&apos;emballage</Label>
              {packagingPlates.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  Aucune matière {packagingMaterialType} disponible.{' '}
                  <a href="/dashboard/plates" className="text-amber-600 underline">Ajouter une matière</a>
                </p>
              ) : (
                <select
                  value={packagingPlateId}
                  onChange={(e) => setPackagingPlateId(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choisir une matière...</option>
                  {packagingPlates.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.name} — {p.material} ({p.width}×{p.height}mm) — {p.cost.toFixed(2)} €/plaque
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quantité */}
            <div className="space-y-2">
              <Label>Quantité d&apos;emballages</Label>
              <input
                type="number" min={1}
                value={packagingQuantity || ''}
                onChange={(e) => setPackagingQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ex : 500"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            {/* Imposition */}
            {packagingItemsPerPlate > 0 && packagingQuantity > 0 && (
              <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-700">{packagingItemsPerPlate}</div>
                  <div className="text-xs text-amber-500 uppercase">Cartons / Plaque</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-700">{packagingPlatesNeeded}</div>
                  <div className="text-xs text-slate-400 uppercase">Plaques nécessaires</div>
                </div>
              </div>
            )}

            {/* Jauge découpe */}
            <div className="space-y-2">
              <GaugeSlider
                label="Temps de découpe par pose"
                value={packagingCuttingTimePerPoseSeconds}
                min={0} max={300} unit="sec"
                onChange={setPackagingCuttingTimePerPoseSeconds}
                formatValue={formatTimeSeconds}
                gradientColors="from-amber-300 to-orange-500"
              />
              <ShortcutButtons
                values={CUTTING_SHORTCUTS}
                selected={packagingCuttingTimePerPoseSeconds}
                onSelect={setPackagingCuttingTimePerPoseSeconds}
                activeClass="bg-amber-500 text-white border-amber-500"
                formatValue={(val) => val === 0 ? '0s' : formatTimeSeconds(val)}
              />
            </div>

            {/* Récap C/BC */}
            {packagingPlateId && packagingQuantity > 0 && packagingItemsPerPlate > 0 && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Matière ({packagingPlatesNeeded} plaque(s) × {plates.find(p => p.id.toString() === packagingPlateId)?.cost.toFixed(2)} €)
                  </span>
                  <span className="font-medium">{packagingMaterialCost.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Découpe</span>
                  <span className="font-medium">{packagingCuttingCost.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-2 font-bold text-amber-800">
                  <span>Total Emballage</span>
                  <span>{packagingTotalCost.toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marge emballage */}
        <div className="flex items-center gap-3 pt-1">
          <Label className="shrink-0 text-sm text-slate-500">Marge emballage</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-400">×</span>
            <Input
              type="number"
              min={1}
              step={0.01}
              value={packagingMargePercent || ''}
              onChange={e => setPackagingMargePercent(parseFloat(e.target.value) || 0)}
              placeholder="1.35"
              className="w-20 text-sm"
            />
          </div>
          {packagingMargePercent > 1 && packagingTotalCost > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              +{(packagingTotalCost - packagingTotalCost / packagingMargePercent).toFixed(2)} &euro;
            </span>
          )}
        </div>

      </div>
    </SectionDisplay>
  )
}
