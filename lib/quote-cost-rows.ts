import type { ImpositionResult, PrintingCostData, SelectedAccessory, SelectedConsumable, Plate } from '@/types/calculator'

export type CostRow = {
  label: string
  detail: string
  value: number
  sub?: boolean
}

export type QuoteCostRowsParams = {
  impositionResult: ImpositionResult | null | undefined
  selectedPlate: Plate | undefined
  hasImpression: boolean
  inkVolumeL: number
  printingCostData: PrintingCostData
  printSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupCost: number
  cuttingMachineTimeMin: number
  cuttingMachineCost: number
  hasFaconnage: boolean
  assemblyTimePerPieceSeconds: number
  assemblyCost: number
  selectedConsumables: SelectedConsumable[]
  consumablesCost: number
  hasConditionnement: boolean
  hasAssemblyNotice: boolean
  packTimePerPieceSeconds: number
  packagingCost: number
  hasAccessoires: boolean
  accessoriesCost: number
  selectedAccessories: SelectedAccessory[]
  hasPackaging: boolean
  packagingTotalCost: number
  packagingMaterialCost: number
  packagingCuttingCost: number
  hasBE?: boolean
  beTimeMinutes?: number
  batTimeMinutes?: number
  beCost?: number
  batCost?: number
  beTotalCost?: number
}

export function buildCostRows(p: QuoteCostRowsParams): CostRow[] {
  return [
    {
      label: 'Matière',
      detail: `${p.impositionResult?.platesNeeded} plaque(s) × ${p.selectedPlate?.cost}€`,
      value: p.impositionResult?.materialCost || 0,
    },
    ...(p.hasImpression ? [
      { label: 'Impression (Encre)', detail: `${p.inkVolumeL.toFixed(3)} L`, value: p.printingCostData.inkCost },
      { label: 'Impression (temps machine)', detail: `${Math.round(p.printingCostData.machineTimeMin)} min`, value: p.printingCostData.machineCost },
      ...(p.printSetupType !== 'none' && p.printingCostData.setupCost > 0 ? [
        { label: `↳ Calage impression (${p.printSetupType})`, detail: 'forfait', value: p.printingCostData.setupCost, sub: true },
      ] : []),
    ] : []),
    { label: 'Découpe (temps machine)', detail: `${Math.round(p.cuttingMachineTimeMin)} min`, value: p.cuttingMachineCost },
    ...(p.cuttingSetupType !== 'none' && p.cuttingSetupCost > 0 ? [
      { label: `↳ Calage découpe (${p.cuttingSetupType})`, detail: 'forfait', value: p.cuttingSetupCost, sub: true },
    ] : []),
    ...(p.hasBE && p.beTotalCost && p.beTotalCost > 0 ? [
      { label: 'Bureau d\'études', detail: `${p.beTimeMinutes ?? 0} min`, value: p.beCost ?? 0 },
      ...(p.batTimeMinutes && p.batTimeMinutes > 0 ? [
        { label: '↳ BAT', detail: `${p.batTimeMinutes} min`, value: p.batCost ?? 0, sub: true },
      ] : []),
    ] : []),
    ...(p.hasFaconnage ? [
      { label: 'Façonnage', detail: `${p.assemblyTimePerPieceSeconds}s/pce`, value: p.assemblyCost },
      ...(p.selectedConsumables.length > 0 ? [
        { label: '↳ Consommables', detail: `${p.selectedConsumables.length} type(s)`, value: p.consumablesCost, sub: true },
      ] : []),
    ] : []),
    ...(p.hasConditionnement ? [
      {
        label: 'Conditionnement',
        detail: p.hasAssemblyNotice ? 'Avec notice' : `${p.packTimePerPieceSeconds}s/pce`,
        value: p.packagingCost,
      },
    ] : []),
    ...(p.hasAccessoires && p.accessoriesCost > 0 ? [
      { label: 'Accessoires', detail: `${p.selectedAccessories.length} réf.`, value: p.accessoriesCost },
    ] : []),
    ...(p.hasPackaging && p.packagingTotalCost > 0 ? [
      { label: 'Emballage', detail: `Mat. ${p.packagingMaterialCost.toFixed(2)}€ + Déc. ${p.packagingCuttingCost.toFixed(2)}€`, value: p.packagingTotalCost },
    ] : []),
  ]
}