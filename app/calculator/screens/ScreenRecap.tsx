'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calculator as CalcIcon, Plus, FileText, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/pdf/QuotePDF'
import { useCalculatorContext } from '../context/CalculatorContext'
import { buildCostRows } from '@/lib/presentation/quote/cost-rows'
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
    showMargeCommerciale,
    showMargeSopano,
    margeCommercialeMontant,
    margeSopanoMontant,
    totalNet,
    amalgameGroups,
    amalgameGroupResults,
  } = useCalculatorContext()

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfClientUrl, setPdfClientUrl] = useState<string | null>(null)
  const [isGeneratingClient, setIsGeneratingClient] = useState(false)
  const pdfGeneratedRef = useRef(false)

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
    printSetupType: isMultiProduct ? 'none' : formState.printSetupType,
    cuttingSetupType: isMultiProduct ? 'none' : formState.cuttingSetupType,
    cuttingMachineTimeMin: costResult.cuttingMachineTimeMin,
    cuttingMachineCost: costResult.cuttingMachineCost,
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
    hasBE: formState.hasBE,
    beTimeMinutes: formState.beTimeMinutes,
    batTimeMinutes: formState.batTimeMinutes,
    beCost: costResult.beCost,
    batCost: costResult.batCost,
    beTotalCost: costResult.beTotalCost,
    hasPackaging: formState.hasPackaging,
    packagingTotalCost: costResult.packagingTotalCost,
    packagingMaterialCost: costResult.packagingMaterialCost,
    packagingCuttingCost: costResult.packagingCuttingCost,
    hasDossierFee: formState.hasDossierFee,
    dossierFeeCost: costResult.dossierFeeCost,
    transportTotal: costResult.transportTotal > 0 ? costResult.transportTotal : undefined,
    transportCostMarged: costResult.transportTotal > 0 ? costResult.transportCostMarged : undefined,
    transportMargin: costResult.transportMargin,
    transportDeliveriesCount: formState.transportDeliveries.length,
    materialCostMarged: costResult.materialCostMarged,
    materialMarginCoeff: costResult.materialMarginCoeff,
  })

  const pdfProps = {
    quoteInfo: {
      studyNumber,
      reference,
      productName: isMultiProduct
        ? `Devis multi-produits (${productSlotResults.length} produits)`
        : productSearch,
      quantity: displayQuantity,
    },
    formValues: formState,
    costResult,
    selectedPlate,
    impositionResult: impositionResult ?? undefined,
    selectedAccessories,
    selectedConsumables,
    isMultiProduct,
    productSlotResults,
    totalCostMulti,
    amalgameGroups,
    amalgameGroupResults,
  }

  const generatePdf = async () => {
    if (pdfUrl) return
    setIsGenerating(true)
    try {
      const blob = await pdf(<QuotePDF {...pdfProps} mode="internal" />).toBlob()
      setPdfUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error('Erreur génération PDF interne:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePdfClient = async () => {
    if (pdfClientUrl) return
    setIsGeneratingClient(true)
    try {
      const blob = await pdf(<QuotePDF {...pdfProps} mode="client" />).toBlob()
      setPdfClientUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error('Erreur génération PDF client:', e)
    } finally {
      setIsGeneratingClient(false)
    }
  }

  useEffect(() => {
    if (pdfGeneratedRef.current) return
    const isReady = isMultiProduct
      ? productSlotResults.length > 0 && (amalgameGroups.length === 0 || amalgameGroupResults.length > 0)
      : impositionResult !== null
    if (!isReady) return
    pdfGeneratedRef.current = true
    generatePdf()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impositionResult, productSlotResults, amalgameGroupResults])

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

          <div className="absolute top-4 right-4 z-20 no-print flex flex-col gap-2 items-end">
            {/* PDF Interne */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-400 font-medium">Interne</span>
              {pdfUrl ? (
                <>
                  <a href={pdfUrl} download={`devis-interne-${studyNumber}.pdf`}>
                    <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger
                    </Button>
                  </a>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </>
              ) : (
                <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm" onClick={generatePdf} disabled={isGenerating}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {isGenerating ? 'Génération...' : 'Générer'}
                </Button>
              )}
            </div>
            {/* PDF Client */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-emerald-400 font-medium">Client</span>
              {pdfClientUrl ? (
                <>
                  <a href={pdfClientUrl} download={`devis-client-${studyNumber}.pdf`}>
                    <Button variant="secondary" size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-emerald-400/30 backdrop-blur-sm">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger
                    </Button>
                  </a>
                  <a href={pdfClientUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-emerald-400/30 backdrop-blur-sm">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </>
              ) : (
                <Button variant="secondary" size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-emerald-400/30 backdrop-blur-sm" onClick={generatePdfClient} disabled={isGeneratingClient}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {isGeneratingClient ? 'Génération...' : 'Générer'}
                </Button>
              )}
            </div>
          </div>

          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0" />
        </div>

        <CardContent className="p-8 space-y-8">

          {/* ── Mode multi-produits : infos par produit ── */}
          {isMultiProduct ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Produits</h3>

              {/* Produits hors amalgame */}
              {productSlotResults.filter(r => !r.slot.amalgameGroupId).map((result, i) => (
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
              ))}

              {/* Groupes amalgame */}
              {amalgameGroups.map((group) => {
                const groupResult = amalgameGroupResults.find(r => r.groupId === group.id)
                if (!groupResult) return null
                const slotsInGroup = productSlotResults.filter(r => r.slot.amalgameGroupId === group.id)
                if (slotsInGroup.length === 0) return null
                return (
                  <div key={group.id} className="bg-violet-50 p-4 rounded-xl border border-violet-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-violet-800">
                        Amalgame : {group.name}
                      </h4>
                      <span className="text-emerald-700 font-bold">{groupResult.totalCost.toFixed(2)} €</span>
                    </div>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between"><dt className="text-slate-500">Plaques</dt><dd className="font-medium">{groupResult.platesCount}</dd></div>
                      {slotsInGroup.map(r => (
                        <div key={r.slot.id} className="flex justify-between text-xs text-violet-700">
                          <dt>· {r.slot.productSearch || r.slot.id}</dt>
                          <dd>{r.slot.quantity} pcs — {r.slot.flatWidth}×{r.slot.flatHeight} mm{r.impositionResult ? ` — ${r.impositionResult.itemsPerPlate} poses/pl.` : ''}</dd>
                        </div>
                      ))}
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

                  {/* En mode multi : sous-totaux par produit (hors amalgame) */}
                  {isMultiProduct && productSlotResults
                    .filter(r => !r.slot.amalgameGroupId)
                    .map((result, i) => (
                      <React.Fragment key={result.slot.id}>
                        <tr className="bg-slate-100">
                          <td colSpan={3} className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">
                            {result.slot.productSearch || `Produit ${i + 1}`} — {result.slot.quantity} pcs
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3">Matière</td>
                          <td className="p-3 text-right text-slate-500 italic text-xs">
                            {result.impositionResult ? `${result.impositionResult.platesNeeded} plaque(s)` : '—'}
                          </td>
                          <td className="p-3 text-right font-medium">{result.costResult.materialCostMarged.toFixed(2)} €</td>
                        </tr>
                        {result.slot.hasImpression && (
                          <>
                            <tr>
                              <td className="p-3">Impression (encre)</td>
                              <td className="p-3 text-right text-slate-500 italic text-xs">{result.costResult.inkVolumeL.toFixed(3)} L</td>
                              <td className="p-3 text-right font-medium">{result.costResult.printingCostData.inkCost.toFixed(2)} €</td>
                            </tr>
                            <tr>
                              <td className="p-3">Impression (machine)</td>
                              <td className="p-3 text-right text-slate-500 italic text-xs">{Math.round(result.costResult.printingCostData.machineTimeMin)} min</td>
                              <td className="p-3 text-right font-medium">{result.costResult.printingCostData.machineCost.toFixed(2)} €</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td className="p-3">Découpe</td>
                          <td className="p-3 text-right text-slate-500 italic text-xs">{Math.round(result.costResult.cuttingMachineTimeMin)} min</td>
                          <td className="p-3 text-right font-medium">{result.costResult.cuttingCost.toFixed(2)} €</td>
                        </tr>
                        <tr className="bg-emerald-50">
                          <td className="p-3 font-semibold text-emerald-800" colSpan={2}>Sous-total {result.slot.productSearch || `Produit ${i + 1}`}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">{result.costResult.subtotal.toFixed(2)} €</td>
                        </tr>
                      </React.Fragment>
                    ))
                  }

                  {/* En mode multi : groupes amalgame */}
                  {isMultiProduct && amalgameGroups.map((group) => {
                    const groupResult = amalgameGroupResults.find(r => r.groupId === group.id)
                    if (!groupResult) return null
                    const slotsInGroup = productSlotResults.filter(r => r.slot.amalgameGroupId === group.id)
                    if (slotsInGroup.length === 0) return null
                    const isImpression = group.amalgameType === 'impression_decoupe'
                    return (
                      <React.Fragment key={group.id}>
                        <tr className="bg-violet-100">
                          <td colSpan={3} className="p-3 font-semibold text-violet-800 text-xs uppercase tracking-wide">
                            Amalgame : {group.name} — {isImpression ? 'Impression + Découpe' : 'Découpe seule'} — {groupResult.platesCount} plaque{groupResult.platesCount > 1 ? 's' : ''}
                          </td>
                        </tr>
                        {slotsInGroup.map((r) => (
                          <tr key={r.slot.id} className="bg-violet-50">
                            <td className="p-3 pl-6 text-violet-700 text-xs" colSpan={2}>
                              · {r.slot.productSearch || r.slot.id} — {r.slot.quantity} pcs — {r.slot.flatWidth}×{r.slot.flatHeight} mm
                              {r.impositionResult ? ` — ${r.impositionResult.itemsPerPlate} poses/pl.` : ''}
                            </td>
                            <td className="p-3 text-right text-slate-400 italic text-xs">—</td>
                          </tr>
                        ))}
                        {isImpression && (
                          <>
                            <tr>
                              <td className="p-3">Matière</td>
                              <td className="p-3 text-right text-slate-500 italic text-xs">{groupResult.platesCount} plaque{groupResult.platesCount > 1 ? 's' : ''}</td>
                              <td className="p-3 text-right font-medium">{groupResult.materialCostMarged.toFixed(2)} €</td>
                            </tr>
                            <tr>
                              <td className="p-3">Impression</td>
                              <td className="p-3 text-right text-slate-500 italic text-xs">{Math.round(groupResult.machineTimeMin)} min</td>
                              <td className="p-3 text-right font-medium">{groupResult.printingCost.toFixed(2)} €</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td className="p-3">Découpe</td>
                          <td className="p-3 text-right text-slate-500 italic text-xs">
                            {Math.round(groupResult.cuttingMachineTimeMin)} min{groupResult.cuttingSetupCost > 0 ? ' + calage' : ''}
                          </td>
                          <td className="p-3 text-right font-medium">{(groupResult.cuttingMachineCost + groupResult.cuttingSetupCost).toFixed(2)} €</td>
                        </tr>
                        <tr className="bg-emerald-50">
                          <td className="p-3 font-semibold text-emerald-800" colSpan={2}>Sous-total {group.name}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">{groupResult.totalCost.toFixed(2)} €</td>
                        </tr>
                      </React.Fragment>
                    )
                  })}

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

            {/* ── Marges internes ── */}
            {(showMargeCommerciale || showMargeSopano) && (
              <div className="mt-4 border rounded-lg overflow-hidden bg-amber-50 border-amber-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-amber-100">
                    {showMargeCommerciale && (
                      <tr>
                        <td className="p-3 text-amber-800">- Com. commerciale (2.5%)</td>
                        <td className="p-3 text-right text-amber-600 italic text-xs">sur total HT</td>
                        <td className="p-3 text-right font-medium text-amber-800">-{margeCommercialeMontant.toFixed(2)} €</td>
                      </tr>
                    )}
                    {showMargeSopano && (
                      <tr>
                        <td className="p-3 text-amber-800">- Com. Sopano (5%)</td>
                        <td className="p-3 text-right text-amber-600 italic text-xs">sur total HT</td>
                        <td className="p-3 text-right font-medium text-amber-800">-{margeSopanoMontant.toFixed(2)} €</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-amber-100">
                    <tr>
                      <td className="p-4 font-bold text-slate-900">Net interne</td>
                      <td className="p-4 text-right opacity-80 text-slate-700">
                        {(totalNet / (displayQuantity || 1)).toFixed(2)} € / pce
                      </td>
                      <td className="p-4 text-right font-bold text-lg text-slate-900">{totalNet.toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-wrap justify-center gap-4 pt-8 border-t border-slate-100 mt-8">
            <Link href="/dashboard/my-quotes">
              <Button variant="outline" size="lg" className="border-slate-200">
                <FileText className="mr-2 h-5 w-5 text-slate-500" /> Mes Chiffrages
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
