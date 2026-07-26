import { useState } from 'react'
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
    cumulerTemps, setCumulerTemps,
    costResult,
    isMultiProduct,
    productSlotResults,
    totalCostMulti,
    totalCostMultiBrut,
    totalQuantityMulti,
    formState,
    margeCommercialeMontant,
    margeSopanoMontant,
    amalgameGroups,
    amalgameGroupResults,
  } = useCalculatorContext()

  const {
    printingCostData,
    dossierFeeCost,
    fournituresEmbCost,
    paletteCost,
    prototypeFeeCost,
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
    // ── Brut ──
    totalCostBrut,
    materialCostRaw,
    cuttingMachineCostBrut,
    assemblyCostBrut,
    packagingCostBrut,
    accessoriesCostBrut,
    packagingTotalCostBrut,
    beCostBrut,
    batCostBrut,
  } = costResult

  // ── Toggle Brut / Margé ──
  const [recapMode, setRecapMode] = useState<'marge' | 'brut'>('marge')
  const brut = recapMode === 'brut'

  const displayTotal = brut
    ? (isMultiProduct ? totalCostMultiBrut : totalCostBrut)
    : (isMultiProduct ? totalCostMulti : totalCost)
  const displayQuantity = isMultiProduct ? totalQuantityMulti : quantity

  // ── Commissions incluses (via /0,925) + alerte anti-perte ──
  const commissionIncluse = margeCommercialeMontant + margeSopanoMontant
  const salePriceTotal = isMultiProduct ? totalCostMulti : totalCost
  const costRevientTotal = isMultiProduct ? totalCostMultiBrut : totalCostBrut
  const venteAPerte = salePriceTotal > 0 && salePriceTotal < costRevientTotal

  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-6 border-slate-200 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>Récapitulatif</CardTitle>
          <CardDescription>{brut ? 'Coût de revient (brut)' : 'Prix de vente (margé)'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">

          {/* ── Toggle Brut / Margé ── */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setRecapMode('marge')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                !brut ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Margé
            </button>
            <button
              type="button"
              onClick={() => setRecapMode('brut')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                brut ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Brut
            </button>
          </div>

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
                      value={brut ? result.costResult.materialCost : result.costResult.materialCostMarged}
                      details={result.impositionResult
                        ? `${result.impositionResult.platesNeeded} plaque(s)${brut ? '' : ` × coeff. ×${result.costResult.materialMarginCoeff.toFixed(1)}`}`
                        : undefined}
                    />
                    {slot.hasImpression && (
                      <>
                        <CostRow
                          label="Impression (encre)"
                          value={brut ? (result.costResult.printingCostData.inkCostRaw ?? 0) : result.costResult.printingCostData.inkCost}
                          details={`${result.costResult.inkVolumeL.toFixed(3)} L`}
                        />
                        {!(cumulerTemps && !isInDecoupeGroup) && (
                          <CostRow
                            label="Impression (machine)"
                            value={brut ? (result.costResult.printingCostData.machineCostBrut ?? 0) : result.costResult.printingCostData.machineCost}
                            details={formatMinutes(result.costResult.printingCostData.machineTimeMin)}
                          />
                        )}
                      </>
                    )}
                    {isInDecoupeGroup ? (
                      <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1.5 rounded-md">
                        <Layers className="h-3 w-3 flex-shrink-0" />
                        <span>Découpe gérée par <strong>{group!.name}</strong></span>
                      </div>
                    ) : cumulerTemps && slot.hasImpression ? (
                      <CostRow
                        label="Impression + Découpe (temps masqué)"
                        value={brut
                          ? ((result.costResult.printingCostData.machineCostBrut ?? 0) + result.costResult.cuttingCostBrut)
                          : (result.costResult.printingCostData.machineCost + result.costResult.cuttingCost)}
                        details={formatMinutes(Math.max(result.costResult.printingCostData.machineTimeMin, result.costResult.cuttingMachineTimeMin))}
                      />
                    ) : (
                      <CostRow
                        label="Découpe"
                        value={brut ? result.costResult.cuttingCostBrut : result.costResult.cuttingCost}
                        details={result.costResult.cuttingMachineTimeMin > 0
                          ? formatMinutes(result.costResult.cuttingMachineTimeMin)
                          : undefined}
                      />
                    )}
                    {result.costResult.subtotal > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md">
                        <span>Sous-total</span>
                        <span>{(brut ? result.costResult.subtotalBrut : result.costResult.subtotal).toFixed(2)} €</span>
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
                const cuttingTotalBrut = result.cuttingMachineCostBrut + result.cuttingSetupCost
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
                          value={brut ? result.materialCostBrut : result.materialCostMarged}
                          details={result.platesCount > 0 ? `${result.platesCount} plaque(s)` : undefined}
                        />
                        {result.printingCostData.inkCost > 0 && (
                          <CostRow
                            label="Encre"
                            value={brut ? (result.printingCostData.inkCostRaw ?? 0) : result.printingCostData.inkCost}
                            details={result.inkVolumeL > 0 ? `${result.inkVolumeL.toFixed(3)} L` : undefined}
                          />
                        )}
                        {!cumulerTemps && (
                          <CostRow
                            label="Temps machine"
                            value={brut ? (result.printingCostData.machineCostBrut ?? 0) : result.printingCostData.machineCost}
                            details={result.machineTimeMin > 0 ? formatMinutes(result.machineTimeMin) : undefined}
                          />
                        )}
                        {result.printingCostData.setupCost > 0 && (
                          <CostRow label="Calage impression" value={result.printingCostData.setupCost} />
                        )}
                      </>
                    )}

                    {cumulerTemps && group.amalgameType === 'impression_decoupe' ? (
                      <CostRow
                        label="Impression + Découpe (temps masqué)"
                        value={brut
                          ? ((result.printingCostData.machineCostBrut ?? 0) + cuttingTotalBrut)
                          : (result.printingCostData.machineCost + cuttingTotal)}
                        details={formatMinutes(Math.max(result.machineTimeMin, result.cuttingMachineTimeMin))}
                      />
                    ) : (
                      <CostRow
                        label="Découpe"
                        value={brut ? cuttingTotalBrut : cuttingTotal}
                        details={result.cuttingMachineTimeMin > 0 ? formatMinutes(result.cuttingMachineTimeMin) : undefined}
                      />
                    )}

                    <div className={`flex justify-between text-sm font-semibold px-2 py-1.5 rounded-md ${
                      group.amalgameType === 'impression_decoupe'
                        ? 'text-violet-700 bg-violet-50'
                        : 'text-orange-700 bg-orange-50'
                    }`}>
                      <span>Sous-total</span>
                      <span>{(brut ? result.totalCostBrut : result.totalCost).toFixed(2)} €</span>
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
                value={brut ? materialCostRaw : materialCostMarged}
                details={impositionResult
                  ? `${impositionResult.platesNeeded} plaque(s)${brut ? '' : ` × coeff. ×${materialMarginCoeff.toFixed(1)}`}`
                  : undefined}
              />

              {hasImpression && (
                <>
                  <CostRow
                    label="Impression (Encre)"
                    value={brut ? (printingCostData.inkCostRaw ?? 0) : printingCostData.inkCost}
                    details={printingCostData.inkCost > 0 ? `${inkVolumeL.toFixed(3)} L` : undefined}
                  />
                  {!cumulerTemps && (
                    <CostRow
                      label="Impression (temps machine)"
                      value={brut ? (printingCostData.machineCostBrut ?? 0) : printingCostData.machineCost}
                      details={printingCostData.machineTimeMin > 0 ? formatMinutes(printingCostData.machineTimeMin) : undefined}
                    />
                  )}
                  {printSetupType !== 'none' && printingCostData.setupCost > 0 && (
                    <CostRow label="Calage impression" value={printingCostData.setupCost} details={`${printingCostData.setupTimeMin} min`} />
                  )}
                </>
              )}

              {cumulerTemps && hasImpression ? (
                <CostRow
                  label="Impression + Découpe (temps masqué)"
                  value={brut ? ((printingCostData.machineCostBrut ?? 0) + cuttingMachineCostBrut) : (printingCostData.machineCost + cuttingMachineCost)}
                  details={formatMinutes(Math.max(printingCostData.machineTimeMin, cuttingMachineTimeMin))}
                />
              ) : (
                <CostRow
                  label="Découpe (temps machine)"
                  value={brut ? cuttingMachineCostBrut : cuttingMachineCost}
                  details={cuttingMachineTimeMin > 0 ? formatMinutes(cuttingMachineTimeMin) : undefined}
                />
              )}
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
                value={brut ? beCostBrut : beCost}
                details={formState.beTimeMinutes > 0 ? `${formState.beTimeMinutes} min` : undefined}
              />
              {formState.batTimeMinutes > 0 && (
                <CostRow
                  label="↳ BAT"
                  value={brut ? batCostBrut : batCost}
                  details={`${formState.batTimeMinutes} min`}
                />
              )}
            </>
          )}

          {/* ── Sections communes ── */}
          {hasFaconnage && (
            <>
              <CostRow label="Façonnage" value={brut ? assemblyCostBrut : assemblyCost} details={getAssemblyDetails()} />
              {selectedConsumables.length > 0 && (
                <CostRow label="Consommables" value={consumablesCost} details={`${selectedConsumables.length} ref(s)`} />
              )}
            </>
          )}

          {hasConditionnement && (
            <CostRow label="Conditionnement" value={brut ? packagingCostBrut : packagingCost} details={getPackDetails()} />
          )}

          {hasAccessoires && (
            <CostRow
              label="Accessoires"
              value={brut ? accessoriesCostBrut : accessoriesCost}
              details={selectedAccessories.length > 0 ? `${selectedAccessories.length} ref(s)` : undefined}
            />
          )}

          {hasPackaging && (
            <CostRow label="Emballage" value={brut ? packagingTotalCostBrut : packagingTotalCost} details={packagingTotalCost > 0 ? 'Matière + découpe' : undefined} />
          )}
          {prototypeFeeCost > 0 && (
            <CostRow label="Forfait prototype (BE + dossier)" value={prototypeFeeCost} details="forfait" />
          )}
          {formState.hasDossierFee && dossierFeeCost > 0 && (
            <CostRow label="Frais de dossier" value={dossierFeeCost} details="forfait" />
          )}
          {fournituresEmbCost > 0 && (
            <CostRow label="Fournitures emballage" value={fournituresEmbCost} details="forfait" />
          )}
          {formState.hasPalette && paletteCost > 0 && (
            <CostRow label="Option palette" value={paletteCost} details="forfait" />
          )}

          {transportCost > 0 && (
            <CostRow
              label="Transport"
              value={brut ? transportCost : transportCostMarged}
              details={formState.transportDeliveries.length > 1
                ? `${formState.transportDeliveries.length} livraisons`
                : undefined}
            />
          )}

          {!brut && commissionIncluse > 0 && (
            <CostRow label="Marge commerciale + Sopano" value={commissionIncluse} details="incluse" />
          )}

          {/* ── Total ── */}
          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="flex justify-between items-end">
              <div className="text-sm font-medium text-slate-500">{brut ? 'Coût de revient' : 'Total HT'}</div>
              <div className={`text-3xl font-bold ${brut ? 'text-orange-600' : 'text-slate-900'}`}>{displayTotal.toFixed(2)} €</div>
            </div>
            <div className="text-right text-xs text-slate-400 mt-1">
              Soit {(displayTotal / (displayQuantity || 1)).toFixed(2)} € / pièce
              {isMultiProduct && ` (${displayQuantity} pcs total)`}
            </div>
          </div>

          {/* ── Alerte anti-perte ── */}
          {venteAPerte && (
            <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <span className="text-sm leading-none">⚠️</span>
              <span>
                <strong>Vente à perte</strong> — prix de vente {salePriceTotal.toFixed(2)} € &lt; coût de revient {costRevientTotal.toFixed(2)} €.
              </span>
            </div>
          )}

          {(hasImpression || isMultiProduct) && (
            <button
              type="button"
              onClick={() => setCumulerTemps(!cumulerTemps)}
              className={`w-full mt-6 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${cumulerTemps ? 'bg-violet-600 text-white border-violet-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {cumulerTemps ? '✓ ' : ''}Cumuler les temps
            </button>
          )}

          <Button className="w-full mt-3 bg-slate-900 hover:bg-slate-800" onClick={handleSave} disabled={isServing}>
            {isServing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder le Devis
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
