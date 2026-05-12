'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { QuotePDF } from '@/components/pdf/QuotePDF'
import { buildCostRows } from '@/lib/presentation/quote/cost-rows'
import { useCalculatorContext } from '../context/CalculatorContext'

export function VoirDevisButton() {
  const {
    studyNumber, productSearch, quantity, selectedPlate, impositionResult,
    hasImpression, formState, costResult, selectedAccessories, selectedConsumables,
    isMultiProduct, productSlotResults, totalCostMulti, totalQuantityMulti,
    amalgameGroups, amalgameGroupResults,
  } = useCalculatorContext()

  const [isGenerating, setIsGenerating] = useState(false)

  const displayQuantity = isMultiProduct ? totalQuantityMulti : quantity

  const handleClick = async () => {
    setIsGenerating(true)
    try {
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
        hasPoseEtiquette: formState.hasPoseEtiquette,
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
      void costRows
      const blob = await pdf(
        <QuotePDF
          quoteInfo={{
            studyNumber,
            reference: null,
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
          amalgameGroups={amalgameGroups}
          amalgameGroupResults={amalgameGroupResults}
          mode="internal"
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (e) {
      console.error('Erreur génération PDF:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="text-slate-900 border-white hover:bg-slate-200"
      onClick={handleClick}
      disabled={isGenerating}
    >
      {isGenerating
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        : <FileText className="mr-2 h-4 w-4" />}
      Voir devis
    </Button>
  )
}
