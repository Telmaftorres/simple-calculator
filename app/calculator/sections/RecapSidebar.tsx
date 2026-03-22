import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { CostRow } from '../shared'
import { formatMinutes } from '@/lib/format'
import { useCalculatorContext } from '../context/CalculatorContext'

export function RecapSidebar() {
  const {
    impositionResult, selectedPlate,
    printingCostData, inkVolumeL,
    hasPrintSetup, hasImpression,
    cuttingMachineCost, cuttingSetupCost,
    cuttingSetupTimeMin, cuttingMachineTimeMin, hasCuttingSetup,
    getCuttingDetails,
    assemblyCost, hasFaconnage, getAssemblyDetails,
    packagingCost, hasConditionnement, getPackDetails,
    accessoriesCost, hasAccessoires, selectedAccessories,
    consumablesCost, selectedConsumables,
    hasPackaging, packagingTotalCost,
    totalCost, quantity,
    handleSave, isServing,
  } = useCalculatorContext()

  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-6 border-slate-200 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>Récapitulatif</CardTitle>
          <CardDescription>Coût Total Estimé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">

          <CostRow
            label="Matière"
            value={impositionResult?.materialCost || 0}
            details={impositionResult ? `${impositionResult.platesNeeded} plaque(s) × ${selectedPlate?.cost}€` : undefined}
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
              {hasPrintSetup && printingCostData.setupCost > 0 && (
                <CostRow label="Calage impression" value={printingCostData.setupCost} details={`${printingCostData.setupTimeMin} min`} />
              )}
            </>
          )}

          <CostRow
            label="Découpe (temps machine)"
            value={cuttingMachineCost}
            details={cuttingMachineTimeMin > 0 ? formatMinutes(cuttingMachineTimeMin) : undefined}
          />
          {hasCuttingSetup && cuttingSetupCost > 0 && (
            <CostRow label="Calage découpe" value={cuttingSetupCost} details={`${cuttingSetupTimeMin} min`} />
          )}

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

          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="flex justify-between items-end">
              <div className="text-sm font-medium text-slate-500">Total HT</div>
              <div className="text-3xl font-bold text-slate-900">{totalCost.toFixed(2)} €</div>
            </div>
            <div className="text-right text-xs text-slate-400 mt-1">
              Soit {(totalCost / (quantity || 1)).toFixed(2)} € / pièce
            </div>
          </div>

          <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800" onClick={handleSave} disabled={isServing}>
            {isServing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder le Devis
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}