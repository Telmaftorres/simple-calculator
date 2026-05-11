import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Layers } from 'lucide-react'
import { CostRow } from '../shared'
import { formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

export function RecapSidebar() {
  const {
    impositionResult, selectedPlate,
    hasImpression,
    printSetupType,
    cuttingSetupType,
    hasFaconnage, getAssemblyDetails,
    hasConditionnement, getPackDetails,
    hasAccessoires, selectedAccessories,
    selectedConsumables,
    hasPackaging,
    quantity,
    handleSave, isServing,
    costResult,
    isMultiProduct,
    productSlotResults,
    totalCostMulti,
    totalQuantityMulti,
    formState,
    showMargeCommerciale,
    showMargeSopano,
    margeCommercialeMontant,
    margeSopanoMontant,
    totalNet,
    amalgameGroups,
    amalgameGroupResults,
  } = useCalculatorContext()

  const {
    printingCostData,
    dossierFeeCost,
    inkVolumeL,
    cuttingMachineCost,
    cuttingSetupCost,
    cuttingSetupTimeMin,
    cuttingMachineTimeMin,
    assemblyCost,
    packagingCost,
    accessoriesCost,
    consumablesCost,
    packagingTotalCost,
    totalCost,
    beCost,
    batCost,
    beTotalCost,
    materialCostMarged,
    materialMarginCoeff,
    transportTotal: transportCost,
    transportCostMarged,
  } = costResult

  const displayTotal = isMultiProduct ? totalCostMulti : totalCost
  const displayQuantity = isMultiProduct ? totalQuantityMulti : quantity

  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-6 border-slate-200 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>Récapitulatif</CardTitle>
          <CardDescription>Coût Total Estimé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">

          {/* ── Mode multi-produits ── */}
          {isMultiProduct ? (
            <>
              {/* Produits hors groupes impression+découpe */}
              {productSlotResults.map((result, i) => {
                const slot = result.slot
                const group = slot.amalgameGroupId
                  ? amalgameGroups.find(g => g.id === slot.amalgameGroupId)
                  : undefined
                if (group?.amalgameType === 'impression_decoupe') return null
                const isInDecoupeGroup = group?.amalgameType === 'decoupe'

                return (
                  <div key={slot.id} className="space-y-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {slot.productSearch || `Produit ${i + 1}`}
                    </div>
                    <CostRow
                      label="Matière"
                      value={result.costResult.materialCostMarged}
                      details={result.impositionResult
                        ? `${result.impositionResult.platesNeeded} plaque(s) × coeff. ×${result.costResult.materialMarginCoeff.toFixed(1)}`
                        : undefined}
                    />
                    {slot.hasImpression && (
                      <>
                        <CostRow
                          label="Impression (encre)"
                          value={result.costResult.printingCostData.inkCost}
                          details={`${result.costResult.inkVolumeL.toFixed(3)} L`}
                        />
                        <CostRow
                          label="Impression (machine)"
                          value={result.costResult.printingCostData.machineCost}
                          details={formatMinutes(result.costResult.printingCostData.machineTimeMin)}
                        />
                      </>
                    )}
                    {isInDecoupeGroup ? (
                      <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1.5 rounded-md">
                        <Layers className="h-3 w-3 flex-shrink-0" />
                        <span>Découpe gérée par <strong>{group!.name}</strong></span>
                      </div>
                    ) : (
                      <CostRow
                        label="Découpe"
                        value={result.costResult.cuttingCost}
                        details={result.costResult.cuttingMachineTimeMin > 0
                          ? formatMinutes(result.costResult.cuttingMachineTimeMin)
                          : undefined}
                      />
                    )}
                    {result.costResult.subtotal > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md">
                        <span>Sous-total</span>
                        <span>{result.costResult.subtotal.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Groupes amalgame — affichés directement avec les produits membres en sous-titre */}
              {amalgameGroups.map(group => {
                const result = amalgameGroupResults.find(r => r.groupId === group.id)
                if (!result || result.totalCost === 0) return null

                const cuttingTotal = result.cuttingMachineCost + result.cuttingSetupCost
                const memberNames = productSlotResults
                  .filter(r => amalgameGroups.find(g => g.id === r.slot.amalgameGroupId)?.id === group.id)
                  .map((r, i) => r.slot.productSearch || `Produit ${i + 1}`)

                return (
                  <div key={group.id} className="space-y-1 border-t border-dashed border-slate-200 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                        group.amalgameType === 'impression_decoupe' ? 'bg-violet-500' : 'bg-orange-500'
                      }`} />
                      {group.name}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        group.amalgameType === 'impression_decoupe'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {group.amalgameType === 'impression_decoupe' ? 'Impression + Découpe' : 'Découpe uniquement'}
                      </span>
                    </div>

                    {memberNames.length > 0 && (
                      <div className="text-xs text-slate-400 pl-3.5 pb-0.5">
                        {memberNames.join(' · ')}
                      </div>
                    )}

                    {group.amalgameType === 'impression_decoupe' && (
                      <>
                        <CostRow
                          label="Matière"
                          value={result.materialCostMarged}
                          details={result.platesCount > 0 ? `${result.platesCount} plaque(s)` : undefined}
                        />
                        {result.printingCostData.inkCost > 0 && (
                          <CostRow
                            label="Encre"
                            value={result.printingCostData.inkCost}
                            details={result.inkVolumeL > 0 ? `${result.inkVolumeL.toFixed(3)} L` : undefined}
                          />
                        )}
                        <CostRow
                          label="Temps machine"
                          value={result.printingCostData.machineCost}
                          details={result.machineTimeMin > 0 ? formatMinutes(result.machineTimeMin) : undefined}
                        />
                        {result.printingCostData.setupCost > 0 && (
                          <CostRow label="Calage impression" value={result.printingCostData.setupCost} />
                        )}
                      </>
                    )}

                    <CostRow
                      label="Découpe"
                      value={cuttingTotal}
                      details={result.cuttingMachineTimeMin > 0 ? formatMinutes(result.cuttingMachineTimeMin) : undefined}
                    />

                    <div className={`flex justify-between text-sm font-semibold px-2 py-1.5 rounded-md ${
                      group.amalgameType === 'impression_decoupe'
                        ? 'text-violet-700 bg-violet-50'
                        : 'text-orange-700 bg-orange-50'
                    }`}>
                      <span>Sous-total</span>
                      <span>{result.totalCost.toFixed(2)} €</span>
                    </div>
                  </div>
                )
              })}

              {/* Séparateur sections communes */}
              {productSlotResults.length > 0 && (
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Sections communes
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <CostRow
                label="Matière"
                value={materialCostMarged}
                details={impositionResult
                  ? `${impositionResult.platesNeeded} plaque(s) × coeff. ×${materialMarginCoeff.toFixed(1)}`
                  : undefined}
              />

              {hasImpression && (
                <>
                  <CostRow
                    label="Impression (Encre)"
                    value={printingCostData.inkCost}
                    details={printingCostData.inkCost > 0 ? `${inkVolumeL.toFixed(3)} L` : undefined}
                  />
                  <CostRow
                    label="Impression (temps machine)"
                    value={printingCostData.machineCost}
                    details={printingCostData.machineTimeMin > 0 ? formatMinutes(printingCostData.machineTimeMin) : undefined}
                  />
                  {printSetupType !== 'none' && printingCostData.setupCost > 0 && (
                    <CostRow label="Calage impression" value={printingCostData.setupCost} details={`${printingCostData.setupTimeMin} min`} />
                  )}
                </>
              )}

              <CostRow
                label="Découpe (temps machine)"
                value={cuttingMachineCost}
                details={cuttingMachineTimeMin > 0 ? formatMinutes(cuttingMachineTimeMin) : undefined}
              />
              {cuttingSetupType !== 'none' && cuttingSetupCost > 0 && (
                <CostRow label="Calage découpe" value={cuttingSetupCost} details={`${cuttingSetupTimeMin} min`} />
              )}
            </>
          )}

          {/* ── Bureau d'études ── */}
          {formState.hasBE && beTotalCost > 0 && (
            <>
              <CostRow
                label="Création / BE"
                value={beCost}
                details={formState.beTimeMinutes > 0 ? `${formState.beTimeMinutes} min` : undefined}
              />
              {formState.batTimeMinutes > 0 && (
                <CostRow
                  label="↳ BAT"
                  value={batCost}
                  details={`${formState.batTimeMinutes} min`}
                />
              )}
            </>
          )}

          {/* ── Sections communes ── */}
          {hasFaconnage && (
            <>
              <CostRow label="Façonnage" value={assemblyCost} details={getAssemblyDetails()} />
              {selectedConsumables.length > 0 && (
                <CostRow label="Consommables" value={consumablesCost} details={`${selectedConsumables.length} ref(s)`} />
              )}
            </>
          )}

          {hasConditionnement && (
            <CostRow label="Conditionnement" value={packagingCost} details={getPackDetails()} />
          )}

          {hasAccessoires && (
            <CostRow
              label="Accessoires"
              value={accessoriesCost}
              details={selectedAccessories.length > 0 ? `${selectedAccessories.length} ref(s)` : undefined}
            />
          )}

          {hasPackaging && (
            <CostRow label="Emballage" value={packagingTotalCost} details={packagingTotalCost > 0 ? 'Matière + découpe' : undefined} />
          )}
          {formState.hasDossierFee && dossierFeeCost > 0 && (
            <CostRow label="Frais de dossier" value={dossierFeeCost} details="forfait" />
          )}

          {transportCost > 0 && (
            <CostRow
              label="Transport"
              value={transportCostMarged}
              details={formState.transportDeliveries.length > 1
                ? `${formState.transportDeliveries.length} livraisons`
                : undefined}
            />
          )}

          {/* ── Total ── */}
          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="flex justify-between items-end">
              <div className="text-sm font-medium text-slate-500">Total HT</div>
              <div className="text-3xl font-bold text-slate-900">{displayTotal.toFixed(2)} €</div>
            </div>
            <div className="text-right text-xs text-slate-400 mt-1">
              Soit {(displayTotal / (displayQuantity || 1)).toFixed(2)} € / pièce
              {isMultiProduct && ` (${displayQuantity} pcs total)`}
            </div>
          </div>

          {/* ── Marges internes ── */}
          {(showMargeCommerciale || showMargeSopano) && (
            <div className="pt-3 border-t border-dashed border-slate-200 space-y-2">
              {showMargeCommerciale && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>- Com. commerciale (2.5%)</span>
                  <span>-{margeCommercialeMontant.toFixed(2)} €</span>
                </div>
              )}
              {showMargeSopano && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>- Com. Sopano (5%)</span>
                  <span>-{margeSopanoMontant.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Net interne</span>
                <span>{totalNet.toFixed(2)} €</span>
              </div>
            </div>
          )}

          <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800" onClick={handleSave} disabled={isServing}>
            {isServing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder le Devis
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
