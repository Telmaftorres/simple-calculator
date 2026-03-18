'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calculator as CalcIcon, Plus, FileText, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatMinutes } from '@/hooks/useCalculator'
import { BlobProvider } from '@react-pdf/renderer'
import { QuotePDF } from '@/app/components/QuotePDF'
import { useCalculatorContext } from '../context/CalculatorContext'

export function ScreenRecap() {
  const {
    studyNumber, productSearch, quantity,
    selectedPlate, flatWidth, flatHeight,
    impositionResult,
    printSurfacePercent, isRectoVerso, rectoVersoType,
    hasVarnish, hasFlatColor, printMode,
    cuttingTimePerPoseSeconds,
    printingCostData, inkVolumeL,
    hasPrintSetup, hasImpression,
    cuttingMachineCost, cuttingSetupCost,
    cuttingSetupTimeMin, cuttingMachineTimeMin, hasCuttingSetup,
    cuttingCost,
    assemblyTimePerPieceSeconds, assemblyCost, hasFaconnage,
    packTimePerPieceSeconds, packagingCost, hasAssemblyNotice, hasConditionnement,
    accessoriesCost, hasAccessoires,
    consumablesCost,
    selectedAccessories, selectedConsumables,
    hasPackaging, packagingTotalCost, packagingMaterialCost, packagingCuttingCost,
    totalCost,
    getCuttingDetails, getAssemblyDetails, getPackDetails,
    setScreenState,
  } = useCalculatorContext()

  const reference = null // sera récupéré depuis le devis sauvegardé si besoin

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in slide-in-from-bottom duration-500">
      <Card className="shadow-2xl border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Devis Sauvegardé</h1>
            <p className="text-emerald-400 font-mono text-lg">{studyNumber}</p>
          </div>

          <div className="absolute top-4 right-4 z-20 no-print">
            <BlobProvider document={
              <QuotePDF
                studyNumber={studyNumber}
                reference={reference}
                productName={productSearch}
                quantity={quantity}
                selectedPlate={selectedPlate}
                flatWidth={flatWidth}
                flatHeight={flatHeight}
                impositionResult={impositionResult || undefined}
                printSurfacePercent={printSurfacePercent}
                isRectoVerso={isRectoVerso}
                rectoVersoType={rectoVersoType}
                hasVarnish={hasVarnish}
                hasFlatColor={hasFlatColor}
                printMode={printMode}
                cuttingTimePerPoseSeconds={cuttingTimePerPoseSeconds}
                assemblyTimePerPieceSeconds={assemblyTimePerPieceSeconds}
                packTimePerPieceSeconds={packTimePerPieceSeconds}
                hasAssemblyNotice={hasAssemblyNotice}
                printingCostData={printingCostData}
                inkVolumeL={inkVolumeL}
                hasPrintSetup={hasPrintSetup}
                hasImpression={hasImpression}
                cuttingCost={cuttingCost}
                cuttingMachineCost={cuttingMachineCost}
                cuttingSetupCost={cuttingSetupCost}
                cuttingSetupTimeMin={cuttingSetupTimeMin}
                cuttingMachineTimeMin={cuttingMachineTimeMin}
                hasCuttingSetup={hasCuttingSetup}
                assemblyCost={assemblyCost}
                hasFaconnage={hasFaconnage}
                packagingCost={packagingCost}
                hasConditionnement={hasConditionnement}
                accessoriesCost={accessoriesCost}
                hasAccessoires={hasAccessoires}
                consumablesCost={consumablesCost}
                selectedAccessories={selectedAccessories}
                selectedConsumables={selectedConsumables}
                hasPackaging={hasPackaging}
                packagingTotalCost={packagingTotalCost}
                packagingMaterialCost={packagingMaterialCost}
                packagingCuttingCost={packagingCuttingCost}
                totalCost={totalCost}
              />
            }>
              {({ url, loading }) => (
                <div className="flex gap-2">
                  <a href={url || '#'} download={`devis-${studyNumber}.pdf`}>
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm" disabled={loading}>
                      <Download className="mr-2 h-4 w-4" />
                      {loading ? 'Génération...' : 'Télécharger PDF'}
                    </Button>
                  </a>
                  <a href={url || '#'} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm" disabled={loading}>
                      <Eye className="mr-2 h-4 w-4" />
                      {loading ? '...' : 'Voir PDF'}
                    </Button>
                  </a>
                </div>
              )}
            </BlobProvider>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0"></div>
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-slate-500" /> Informations
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Dossier</dt><dd className="font-medium">{studyNumber}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Produit</dt><dd className="font-medium">{productSearch}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Quantité</dt><dd className="font-medium">{quantity}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Matière</dt><dd className="font-medium">{selectedPlate?.name}</dd></div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <dt className="text-slate-500">Format à Plat</dt>
                  <dd className="font-medium">{flatWidth}x{flatHeight} mm</dd>
                </div>
              </dl>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CalcIcon className="w-4 h-4 text-slate-500" /> Technique
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Poses / Plaque</dt><dd className="font-medium">{impositionResult?.itemsPerPlate}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Plaques Nécessaires</dt><dd className="font-medium">{impositionResult?.platesNeeded}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Surface Imprimée</dt><dd className="font-medium">{printSurfacePercent}%</dd></div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Impression</dt>
                  <dd className="font-medium">
                    {!hasImpression ? 'Non incluse' : isRectoVerso
                      ? `Recto/Verso — ${rectoVersoType === 'identical' ? 'Identique' : rectoVersoType === 'different' ? 'Différent' : 'Non précisé'}`
                      : 'Recto seul'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Temps Découpe</dt>
                  <dd className="font-medium">{cuttingTimePerPoseSeconds} s/pose</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Tableau des coûts */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Détail des Coûts</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3 text-left">Poste</th>
                    <th className="p-3 text-right">Détail</th>
                    <th className="p-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3">Matière</td>
                    <td className="p-3 text-right text-slate-500 italic">{impositionResult?.platesNeeded} plaque(s)</td>
                    <td className="p-3 text-right font-medium">{impositionResult?.materialCost.toFixed(2)} €</td>
                  </tr>

                  {hasImpression && (
                    <>
                      <tr>
                        <td className="p-3">Impression (Encre)</td>
                        <td className="p-3 text-right text-slate-500 italic">{inkVolumeL.toFixed(3)} L</td>
                        <td className="p-3 text-right font-medium">{printingCostData.inkCost.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td className="p-3">Impression (temps machine)</td>
                        <td className="p-3 text-right text-slate-500 italic text-xs">{formatMinutes(printingCostData.machineTimeMin)}</td>
                        <td className="p-3 text-right font-medium">{printingCostData.machineCost.toFixed(2)} €</td>
                      </tr>
                      {hasPrintSetup && printingCostData.setupCost > 0 && (
                        <tr className="bg-slate-50/50">
                          <td className="p-3 text-slate-600 pl-6 border-l-2 border-purple-200">↳ Calage impression</td>
                          <td className="p-3 text-right text-slate-500 italic text-xs">{printingCostData.setupTimeMin} min</td>
                          <td className="p-3 text-right font-medium">{printingCostData.setupCost.toFixed(2)} €</td>
                        </tr>
                      )}
                    </>
                  )}

                  <tr>
                    <td className="p-3">Découpe (temps machine)</td>
                    <td className="p-3 text-right text-slate-500 italic text-xs">{formatMinutes(cuttingMachineTimeMin)}</td>
                    <td className="p-3 text-right font-medium">{cuttingMachineCost.toFixed(2)} €</td>
                  </tr>
                  {hasCuttingSetup && cuttingSetupCost > 0 && (
                    <tr className="bg-slate-50/50">
                      <td className="p-3 text-slate-600 pl-6 border-l-2 border-orange-200">↳ Calage découpe</td>
                      <td className="p-3 text-right text-slate-500 italic text-xs">{cuttingSetupTimeMin} min</td>
                      <td className="p-3 text-right font-medium">{cuttingSetupCost.toFixed(2)} €</td>
                    </tr>
                  )}

                  {hasFaconnage && (
                    <>
                      <tr>
                        <td className="p-3">Façonnage</td>
                        <td className="p-3 text-right text-slate-500 italic text-xs">{getAssemblyDetails()}</td>
                        <td className="p-3 text-right font-medium">{assemblyCost.toFixed(2)} €</td>
                      </tr>
                      {selectedConsumables.length > 0 && (
                        <tr>
                          <td className="p-3 text-slate-600 pl-6 border-l-2 border-slate-200">↳ Consommables</td>
                          <td className="p-3 text-right text-slate-500 italic text-xs">{selectedConsumables.length} type(s)</td>
                          <td className="p-3 text-right font-medium">{consumablesCost.toFixed(2)} €</td>
                        </tr>
                      )}
                    </>
                  )}

                  {hasConditionnement && (
                    <tr>
                      <td className="p-3">Conditionnement</td>
                      <td className="p-3 text-right text-slate-500 italic text-xs">{getPackDetails()}</td>
                      <td className="p-3 text-right font-medium">{packagingCost.toFixed(2)} €</td>
                    </tr>
                  )}

                  {hasAccessoires && accessoriesCost > 0 && (
                    <tr>
                      <td className="p-3">Accessoires</td>
                      <td className="p-3 text-right text-slate-500 italic text-xs">{selectedAccessories.length} réf.</td>
                      <td className="p-3 text-right font-medium">{accessoriesCost.toFixed(2)} €</td>
                    </tr>
                  )}

                  {hasPackaging && packagingTotalCost > 0 && (
                    <tr>
                      <td className="p-3">Emballage</td>
                      <td className="p-3 text-right text-slate-500 italic text-xs">
                        Matière {packagingMaterialCost.toFixed(2)}€ + Découpe {packagingCuttingCost.toFixed(2)}€
                      </td>
                      <td className="p-3 text-right font-medium">{packagingTotalCost.toFixed(2)} €</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td className="p-4 font-bold">Total HT</td>
                    <td className="p-4 text-right opacity-80">{(totalCost / (quantity || 1)).toFixed(2)} € / pce</td>
                    <td className="p-4 text-right font-bold text-lg">{totalCost.toFixed(2)} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-8 border-t border-slate-100 mt-8">
            <Link href="/dashboard/my-quotes">
              <Button variant="outline" size="lg" className="border-slate-200">
                <FileText className="mr-2 h-5 w-5 text-slate-500" /> Mes Devis
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="border-slate-200">
                <LayoutDashboard className="mr-2 h-5 w-5 text-slate-500" /> Dashboard
              </Button>
            </Link>
            <Button onClick={() => setScreenState('form')} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-5 w-5" /> Nouveau Devis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}