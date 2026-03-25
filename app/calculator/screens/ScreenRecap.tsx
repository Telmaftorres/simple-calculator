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
  } = useCalculatorContext()

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const reference = null

  const costRows = buildCostRows({
    impositionResult,
    selectedPlate,
    hasImpression,
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

  const generatePdf = async () => {
    if (pdfUrl) return
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <QuotePDF
          quoteInfo={{
            studyNumber,
            reference,
            productName: productSearch,
            quantity,
          }}
          formValues={formState}
          costResult={costResult}
          selectedPlate={selectedPlate}
          impositionResult={impositionResult ?? undefined}
          selectedAccessories={selectedAccessories}
          selectedConsumables={selectedConsumables}
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

      {/* ── Bouton Dashboard au-dessus de la card ── */}
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
          </div>

          {/* ── Boutons PDF ── */}
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

          {/* ── Infos générales ── */}
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
                    <td className="p-4 text-right opacity-80">{(costResult.totalCost / (quantity || 1)).toFixed(2)} € / pce</td>
                    <td className="p-4 text-right font-bold text-lg">{costResult.totalCost.toFixed(2)} €</td>
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