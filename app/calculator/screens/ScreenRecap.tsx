'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calculator as CalcIcon, Plus, FileText, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/QuotePDF'
import { useCalculatorContext } from '../context/CalculatorContext'
import { buildCostRows } from '@/lib/quote-cost-rows'
import React from 'react'

export function ScreenRecap() {
  const {
    studyNumber,
    productSearch,
    quantity,
    selectedPlate,
    flatWidth,
    flatHeight,
    impositionResult,
    inkMlPerPlate,
    varnishSurfacePercent,
    flatColorSurfacePercent,
    isRectoVerso,
    rectoVersoType,
    hasVarnish,
    hasFlatColor,
    hasImpression,
    cuttingTimePerPoseSeconds,
    setScreenState,
    formState,
    costResult,
    selectedAccessories,
    selectedConsumables,
    isMultiProduct,
    productSlotResults,
    totalCostMulti,
    totalQuantityMulti,
  } = useCalculatorContext()

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const reference = null
  const displayTotal = isMultiProduct ? totalCostMulti : costResult.totalCost
  const displayQuantity = isMultiProduct ? totalQuantityMulti : quantity

  // ── Lignes du tableau de coûts ──
  const costRows = buildCostRows({
    impositionResult: isMultiProduct ? null : impositionResult,
    selectedPlate: isMultiProduct ? undefined : selectedPlate,
    hasImpression: isMultiProduct ? false : hasImpression,
    inkVolumeL: costResult.inkVolumeL,
    printingCostData: costResult.printingCostData,
    hasPrintSetup: formState.hasPrintSetup,
    cuttingMachineTimeMin: costResult.cuttingMachineTimeMin,
    cuttingMachineCost: costResult.cuttingMachineCost,
    hasCuttingSetup: formState.hasCuttingSetup,
    cuttingSetupTimeMin: costResult.cuttingSetupTimeMin,
    cuttingSetupCost: costResult.cuttingSetupCost,
    hasFaconnage: formState.hasFaconnage,
    assemblyTimePerPieceSeconds: formState.assemblyTimePerPieceSeconds,
    assemblyCost: costResult.assemblyCost,
    selectedConsumables,
    consumablesCost: costResult.consumablesCost,
    hasConditionnement: formState.hasConditionnement,
    hasAssemblyNotice: formState.hasAssemblyNotice,
    packTimePerPieceSeconds: formState.packTimePerPieceSeconds,
    packagingCost: costResult.packagingCost,
    hasAccessoires: formState.hasAccessoires,
    accessoriesCost: costResult.accessoriesCost,
    selectedAccessories,
    hasPackaging: formState.hasPackaging,
    packagingTotalCost: costResult.packagingTotalCost,
    packagingMaterialCost: costResult.packagingMaterialCost,
    packagingCuttingCost: costResult.packagingCuttingCost,
  })

  console.log('assemblyCost:', costResult.assemblyCost)
  console.log('packagingCost:', costResult.packagingCost)
  console.log('hasFaconnage:', formState.hasFaconnage)
  console.log('hasConditionnement:', formState.hasConditionnement)
  console.log('costRows:', costRows)

  const generatePdf = async () => {
    if (pdfUrl) return
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <QuotePDF
          quoteInfo={{
            studyNumber,
            reference,
            productName: isMultiProduct
              ? `Devis multi-produits (${productSlotResults.length} produits)`
              : productSearch,
            quantity: displayQuantity,
          }}
          formValues={formState}
          costResult={costResult}
          selectedPlate={selectedPlate}
          impositionResult={impositionResult ?? undefined}
          selectedAccessories={selectedAccessories}
          selectedConsumables={selectedConsumables}
          isMultiProduct={isMultiProduct}
          productSlotResults={productSlotResults}
          totalCostMulti={totalCostMulti}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (e) {
      console.error('Erreur génération PDF:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    generatePdf()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in slide-in-from-bottom duration-500">

      <div className="flex justify-end mb-4">
        <Link href="/dashboard">
          <Button variant="outline" className="border-slate-200">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <Card className="shadow-2xl border-slate-200 overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Devis Sauvegardé</h1>
            <p className="text-emerald-400 font-mono text-lg">{studyNumber}</p>
            {isMultiProduct && (
              <p className="text-slate-400 text-sm mt-1">{productSlotResults.length} produits</p>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20 no-print flex gap-2 items-center">
            {pdfUrl ? (
              <>
                <a href={pdfUrl} download={`devis-${studyNumber}.pdf`}>
                  <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                    <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                  </Button>
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                    <Eye className="mr-2 h-4 w-4" /> Voir PDF
                  </Button>
                </a>
              </>
            ) : (
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                onClick={generatePdf}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                {isGenerating ? 'Génération...' : 'Générer PDF'}
              </Button>
            )}
          </div>

          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0" />
        </div>

        <CardContent className="p-8 space-y-8">

          {/* ── Mode multi-produits : infos par produit ── */}
          {isMultiProduct ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Produits</h3>
              {productSlotResults.map((result, i) => {
                const plate = result.slot.selectedPlateId
                  ? undefined
                  : undefined
                return (
                  <div key={result.slot.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-slate-800">
                        {result.slot.productSearch || `Produit ${i + 1}`}
                      </h4>
                      <span className="text-emerald-700 font-bold">{result.costResult.subtotal.toFixed(2)} €</span>
                    </div>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between"><dt className="text-slate-500">Quantité</dt><dd className="font-medium">{result.slot.quantity}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Format</dt><dd className="font-medium">{result.slot.flatWidth}×{result.slot.flatHeight} mm</dd></div>
                      {result.impositionResult && (
                        <>
                          <div className="flex justify-between"><dt className="text-slate-500">Poses / Plaque</dt><dd className="font-medium">{result.impositionResult.itemsPerPlate}</dd></div>
                          <div className="flex justify-between"><dt className="text-slate-500">Plaques</dt><dd className="font-medium">{result.impositionResult.platesNeeded}</dd></div>
                        </>
                      )}
                      {result.slot.hasImpression && (
                        <div className="flex justify-between"><dt className="text-slate-500">Encre</dt><dd className="font-medium">{result.slot.inkMlPerPlate} ml/plaque</dd></div>
                      )}
                    </dl>
                  </div>
                )
              })}

              {/* Sections communes */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-3">Sections communes</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Quantité totale</dt><dd className="font-medium">{totalQuantityMulti} pcs</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Dossier</dt><dd className="font-medium">{studyNumber}</dd></div>
                </dl>
              </div>
            </div>
          ) : (
            /* ── Mode mono : infos classiques ── */
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
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Encre</dt>
                    <dd className="font-medium">{inkMlPerPlate} ml/plaque</dd>
                  </div>
                  {(hasVarnish || hasFlatColor) && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Finitions</dt>
                      <dd className="font-medium text-right">
                        {hasVarnish && <span className="text-purple-700">Vernis {varnishSurfacePercent}%</span>}
                        {hasVarnish && hasFlatColor && <span> · </span>}
                        {hasFlatColor && <span className="text-violet-700">Aplat {flatColorSurfacePercent}%</span>}
                      </dd>
                    </div>
                  )}
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
          )}

          {/* ── Tableau des coûts ── */}
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

                  {/* En mode multi : sous-totaux par produit */}
                  {isMultiProduct && productSlotResults.map((result, i) => (
                    <React.Fragment key={result.slot.id}>
                      <tr className="bg-slate-100">
                        <td colSpan={3} className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">
                          {result.slot.productSearch || `Produit ${i + 1}`} — {result.slot.quantity} pcs
                        </td>
                      </tr>
                      <tr key={`matiere-${i}`}>
                        <td className="p-3">Matière</td>
                        <td className="p-3 text-right text-slate-500 italic text-xs">
                          {result.impositionResult ? `${result.impositionResult.platesNeeded} plaque(s)` : '—'}
                        </td>
                        <td className="p-3 text-right font-medium">{result.costResult.materialCost.toFixed(2)} €</td>
                      </tr>
                      {result.slot.hasImpression && (
                        <>
                          <tr key={`impression-encre-${i}`}>
                            <td className="p-3">Impression (encre)</td>
                            <td className="p-3 text-right text-slate-500 italic text-xs">{result.costResult.inkVolumeL.toFixed(3)} L</td>
                            <td className="p-3 text-right font-medium">{result.costResult.printingCostData.inkCost.toFixed(2)} €</td>
                          </tr>
                          <tr key={`impression-machine-${i}`}>
                            <td className="p-3">Impression (machine)</td>
                            <td className="p-3 text-right text-slate-500 italic text-xs">{Math.round(result.costResult.printingCostData.machineTimeMin)} min</td>
                            <td className="p-3 text-right font-medium">{result.costResult.printingCostData.machineCost.toFixed(2)} €</td>
                          </tr>
                        </>
                      )}
                      <tr key={`decoupe-${i}`}>
                        <td className="p-3">Découpe</td>
                        <td className="p-3 text-right text-slate-500 italic text-xs">{Math.round(result.costResult.cuttingMachineTimeMin)} min</td>
                        <td className="p-3 text-right font-medium">{result.costResult.cuttingCost.toFixed(2)} €</td>
                      </tr>
                      <tr key={`subtotal-${i}`} className="bg-emerald-50">
                        <td className="p-3 font-semibold text-emerald-800" colSpan={2}>Sous-total {result.slot.productSearch || `Produit ${i + 1}`}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{result.costResult.subtotal.toFixed(2)} €</td>
                      </tr>
                    </React.Fragment>
                  ))}

                  {/* Sections communes (toujours affichées) */}
                  {isMultiProduct && costRows.length > 0 && (
                    <tr className="bg-slate-100">
                      <td colSpan={3} className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">
                        Sections communes
                      </td>
                    </tr>
                  )}

                  {/* Lignes communes */}
                  {costRows.map((row, i) => (
                    <tr key={i} className={row.sub ? 'bg-slate-50/50' : ''}>
                      <td className={`p-3 ${row.sub ? 'text-slate-600 pl-6 border-l-2 border-slate-200' : ''}`}>
                        {row.label}
                      </td>
                      <td className="p-3 text-right text-slate-500 italic text-xs">{row.detail}</td>
                      <td className="p-3 text-right font-medium">{row.value.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td className="p-4 font-bold">Total HT</td>
                    <td className="p-4 text-right opacity-80">
                      {(displayTotal / (displayQuantity || 1)).toFixed(2)} € / pce
                    </td>
                    <td className="p-4 text-right font-bold text-lg">{displayTotal.toFixed(2)} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Actions ── */}
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