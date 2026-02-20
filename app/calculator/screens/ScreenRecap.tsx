import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calculator as CalcIcon, Plus } from 'lucide-react'
import { formatTimeSeconds, formatMinutes } from '@/hooks/useCalculator'
import { ImpositionResult, PrintingCostData, Plate, SelectedAccessory } from '@/types/calculator'

interface ScreenRecapProps {
  studyNumber: string
  productSearch: string
  quantity: number
  selectedPlate: Plate | undefined
  flatWidth: number
  flatHeight: number
  impositionResult: ImpositionResult | undefined
  printSurfacePercent: number
  cuttingTimePerPoseSeconds: number
  printingCostData: PrintingCostData
  cuttingCost: number
  assemblyTimePerPieceSeconds: number
  assemblyCost: number
  packTimePerPieceSeconds: number
  packagingCost: number
  totalCost: number
  accessoriesCost: number
  getCuttingDetails: () => string
  getAssemblyDetails: () => string
  getPackDetails: () => string
  setScreenState: (state: 'form' | 'success' | 'recap') => void
}

export function ScreenRecap({
  studyNumber,
  productSearch,
  quantity,
  selectedPlate,
  flatWidth,
  flatHeight,
  impositionResult,
  printSurfacePercent,
  cuttingTimePerPoseSeconds,
  printingCostData,
  cuttingCost,
  assemblyTimePerPieceSeconds,
  assemblyCost,
  packTimePerPieceSeconds,
  packagingCost,
  totalCost,
  getCuttingDetails,
  getAssemblyDetails,
  getPackDetails,
  setScreenState,
}: ScreenRecapProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in slide-in-from-bottom duration-500">
      <Card className="shadow-2xl border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Devis Sauvegardé</h1>
            <p className="text-emerald-400 font-mono text-lg">{studyNumber}</p>
          </div>
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0"></div>
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Box 1: Info Client */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-slate-500" /> Informations
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Dossier</dt>
                  <dd className="font-medium">{studyNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Produit</dt>
                  <dd className="font-medium">{productSearch}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Quantité</dt>
                  <dd className="font-medium">{quantity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Matière</dt>
                  <dd className="font-medium">{selectedPlate?.name}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <dt className="text-slate-500">Format à Plat</dt>
                  <dd className="font-medium">
                    {flatWidth}x{flatHeight} mm
                  </dd>
                </div>
              </dl>
            </div>

            {/* Box 2: Production */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CalcIcon className="w-4 h-4 text-slate-500" /> Technique
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Poses / Plaque</dt>
                  <dd className="font-medium">{impositionResult?.itemsPerPlate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Plaques Nécessaires</dt>
                  <dd className="font-medium">{impositionResult?.platesNeeded}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Surface Imprimée</dt>
                  <dd className="font-medium">{printSurfacePercent}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Temps Découpe</dt>
                  <dd className="font-medium">
                    {cuttingTimePerPoseSeconds} s/pose (calage incl.)
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Cost Breakdown Table */}
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
                    <td className="p-3 text-right text-slate-500 italic">
                      {impositionResult?.platesNeeded} plaque(s)
                    </td>
                    <td className="p-3 text-right font-medium">
                      {impositionResult?.materialCost.toFixed(2)} €
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Impression (Encre)</td>
                    <td className="p-3 text-right text-slate-500 italic">
                      {(printingCostData.inkCost / 40).toFixed(3)} L
                    </td>
                    <td className="p-3 text-right font-medium">
                      {printingCostData.inkCost.toFixed(2)} €
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Impression (Temps)</td>
                    <td className="p-3 text-right text-slate-500 italic text-xs">
                      {formatMinutes(printingCostData.timeMin)} (incl. 15min)
                    </td>
                    <td className="p-3 text-right font-medium">
                      {printingCostData.laborCost.toFixed(2)} €
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Découpe</td>
                    <td className="p-3 text-right text-slate-500 italic text-xs">
                      {getCuttingDetails()}
                    </td>
                    <td className="p-3 text-right font-medium">{cuttingCost.toFixed(2)} €</td>
                  </tr>
                  <tr>
                    <td className="p-3">Façonnage</td>
                    <td className="p-3 text-right text-slate-500 italic text-xs">
                      {getAssemblyDetails()}
                    </td>
                    <td className="p-3 text-right font-medium">{assemblyCost.toFixed(2)} €</td>
                  </tr>
                  <tr>
                    <td className="p-3">Conditionnement</td>
                    <td className="p-3 text-right text-slate-500 italic text-xs">
                      {getPackDetails()}
                    </td>
                    <td className="p-3 text-right font-medium">{packagingCost.toFixed(2)} €</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td className="p-4 font-bold">Total HT</td>
                    <td className="p-4 text-right opacity-80 decoration-slate-400">
                      {(totalCost / (quantity || 1)).toFixed(2)} € / pce
                    </td>
                    <td className="p-4 text-right font-bold text-lg">{totalCost.toFixed(2)} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button
              onClick={() => setScreenState('form')}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-5 w-5" /> Nouveau Devis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
