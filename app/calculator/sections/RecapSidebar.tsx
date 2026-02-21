import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { CostRow } from '../shared'
import { ImpositionResult, Plate, PrintingCostData, SelectedAccessory, SelectedConsumable } from '@/types/calculator'
import { formatMinutes } from '@/hooks/useCalculator'

interface RecapSidebarProps {
  impositionResult: ImpositionResult | undefined
  selectedPlate: Plate | undefined
  printingCostData: PrintingCostData
  cuttingCost: number
  getCuttingDetails: () => string
  assemblyCost: number
  getAssemblyDetails: () => string
  packagingCost: number
  getPackDetails: () => string
  accessoriesCost: number
  selectedAccessories: SelectedAccessory[]
  consumablesCost: number
  selectedConsumables: SelectedConsumable[]
  totalCost: number
  quantity: number
  handleSave: () => void
  isServing: boolean
}

export function RecapSidebar({
  impositionResult,
  selectedPlate,
  printingCostData,
  cuttingCost,
  getCuttingDetails,
  assemblyCost,
  getAssemblyDetails,
  packagingCost,
  getPackDetails,
  accessoriesCost,
  selectedAccessories,
  consumablesCost,
  selectedConsumables,
  totalCost,
  quantity,
  handleSave,
  isServing,
}: RecapSidebarProps) {
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
            details={
              impositionResult
                ? `${impositionResult.platesNeeded} plaque(s) × ${selectedPlate?.cost}€`
                : undefined
            }
          />

          <CostRow
            label="Impression (Encre)"
            value={printingCostData.inkCost}
            details={
              printingCostData.inkCost > 0
                ? `${(printingCostData.inkCost / 40).toFixed(3)} L`
                : undefined
            }
          />

          <CostRow
            label="Impression (Temps)"
            value={printingCostData.laborCost}
            details={
              printingCostData.laborCost > 0
                ? `${formatMinutes(printingCostData.timeMin)} (incl. 15min calage)`
                : undefined
            }
          />

          <CostRow label="Découpe" value={cuttingCost} details={getCuttingDetails()} />

          <CostRow label="Façonnage" value={assemblyCost} details={getAssemblyDetails()} />

          <CostRow label="Conditionnement" value={packagingCost} details={getPackDetails()} />

          <CostRow
            label="Accessoires"
            value={accessoriesCost}
            details={
              selectedAccessories.length > 0 ? `${selectedAccessories.length} ref(s)` : undefined
            }
          />

          <CostRow
            label="Consommables"
            value={consumablesCost}
            details={
              selectedConsumables.length > 0 ? `${selectedConsumables.length} ref(s)` : undefined
            }
          />

          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="flex justify-between items-end">
              <div className="text-sm font-medium text-slate-500">Total HT</div>
              <div className="text-3xl font-bold text-slate-900">{totalCost.toFixed(2)} €</div>
            </div>
            <div className="text-right text-xs text-slate-400 mt-1">
              Soit {(totalCost / (quantity || 1)).toFixed(2)} € / pièce
            </div>
          </div>

          <Button
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800"
            onClick={handleSave}
            disabled={isServing}
          >
            {isServing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder le Devis
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
