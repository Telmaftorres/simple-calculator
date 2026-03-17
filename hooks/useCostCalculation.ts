import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  INK_COST_PER_LITER,
  INK_BASE_ML_PER_PLATE,
  PRINT_SETUP_TIME_MIN,
  CUTTING_SETUP_SECONDS,
  FINISHING_SURCHARGE_PERCENT,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
} from '@/lib/constants'
import { calculateImposition } from '@/lib/calculation/imposition'
import type {
  ImpositionResult,
  SelectedAccessory,
  SelectedConsumable,
  PrintingCostData,
  Plate,
  PrintMode,
} from '@/types/calculator'

export interface CostCalculationParams {
  quantity: number
  impositionResult: ImpositionResult | null
  selectedPlate: Plate | undefined
  printSurfacePercent: number
  printMode: PrintMode
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  cuttingTimePerPoseSeconds: number
  assemblyTimePerPieceSeconds: number
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  selectedAccessories: SelectedAccessory[]
  selectedConsumables: SelectedConsumable[]
  settings?: Record<string, number>
  // Emballage
  hasPackaging: boolean
  packagingPlate: Plate | undefined
  packagingQuantity: number
  packagingCuttingTimePerPoseSeconds: number
  packagingWidth: number
  packagingHeight: number
}

export function useCostCalculation(params: CostCalculationParams) {
  const {
    quantity,
    impositionResult,
    selectedPlate,
    printSurfacePercent,
    printMode,
    isRectoVerso,
    hasVarnish,
    hasFlatColor,
    cuttingTimePerPoseSeconds,
    assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds,
    hasAssemblyNotice,
    selectedAccessories,
    selectedConsumables,
    settings,
    hasPackaging,
    packagingPlate,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth,
    packagingHeight,
  } = params

  // Fallback sur les constantes si DB indisponible
  const hourlyRatePrint = settings?.HOURLY_RATE_PRINT ?? HOURLY_RATE_PRINT
  const hourlyRateAssembly = settings?.HOURLY_RATE_ASSEMBLY ?? HOURLY_RATE_ASSEMBLY
  const inkCostPerLiter = settings?.INK_COST_PER_LITER ?? INK_COST_PER_LITER
  const inkBaseMlPerPlate = settings?.INK_BASE_ML_PER_PLATE ?? INK_BASE_ML_PER_PLATE
  const printSetupTimeMin = settings?.PRINT_SETUP_TIME_MIN ?? PRINT_SETUP_TIME_MIN
  const cuttingSetupSeconds = settings?.CUTTING_SETUP_SECONDS ?? CUTTING_SETUP_SECONDS
  const finishingSurchargePercent = settings?.FINISHING_SURCHARGE_PERCENT ?? FINISHING_SURCHARGE_PERCENT
  const assemblyNoticeCostPerPiece = settings?.ASSEMBLY_NOTICE_COST_PER_PIECE ?? ASSEMBLY_NOTICE_COST_PER_PIECE

  // ── Impression ──
  const printingCostData: PrintingCostData = (() => {
    if (!impositionResult || !selectedPlate)
      return { cost: 0, timeMin: 0, inkCost: 0, laborCost: 0, inkVolumeL: 0 }

    const multiplier = isRectoVerso ? 2 : 1

    const inkVolumeL =
      ((impositionResult.platesNeeded * inkBaseMlPerPlate * (printSurfacePercent / 100)) / 1000)
      * multiplier

    const finishingMultiplier =
      1 +
      (hasVarnish ? finishingSurchargePercent : 0) +
      (hasFlatColor ? finishingSurchargePercent : 0)
    const inkCost = inkVolumeL * inkCostPerLiter * finishingMultiplier

    const plateAreaM2 = (selectedPlate.width * selectedPlate.height) / 1000000
    const printedAreaM2 = plateAreaM2 * (printSurfacePercent / 100)
    const pace = printMode === 'production' ? 1 : 2
    const timePerPlateMin = printedAreaM2 * pace * multiplier
    const setupTimeMin = printSurfacePercent > 0 ? printSetupTimeMin : 0
    const totalTimeMin = timePerPlateMin * impositionResult.platesNeeded + setupTimeMin
    const laborCost = (totalTimeMin / 60) * hourlyRatePrint

    return { cost: inkCost + laborCost, timeMin: totalTimeMin, inkCost, laborCost, inkVolumeL }
  })()

  const printingCost = printingCostData.cost

  // ── Découpe ──
  const cuttingCost = (() => {
    if (!impositionResult) return 0
    const totalSeconds = cuttingTimePerPoseSeconds * quantity + cuttingSetupSeconds
    return (totalSeconds / 3600) * hourlyRatePrint
  })()

  // ── Façonnage ──
  const assemblyCost = (() => {
    const totalHours = (assemblyTimePerPieceSeconds * quantity) / 3600
    return totalHours * hourlyRateAssembly
  })()

  // ── Conditionnement ──
  const packagingCost = (() => {
    const totalHours = (packTimePerPieceSeconds * quantity) / 3600
    const timeCost = totalHours * hourlyRateAssembly
    const noticeCost = hasAssemblyNotice ? assemblyNoticeCostPerPiece * quantity : 0
    return timeCost + noticeCost
  })()

  // ── Accessoires ──
  const accessoriesCost = selectedAccessories.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // ── Consommables ──
  const consumablesCost = selectedConsumables.reduce(
    (sum, item) => sum + ((item.sizePerItem * item.quantity) / item.size) * item.price,
    0
  )

  // ── Emballage — imposition ──
  const packagingItemsPerPlate = (() => {
    if (!hasPackaging || !packagingPlate || packagingWidth <= 0 || packagingHeight <= 0) return 0
    const imp = calculateImposition(
      { width: packagingWidth, height: packagingHeight },
      { width: packagingPlate.width, height: packagingPlate.height },
      10
    )
    return imp.itemsPerPlate
  })()

  const packagingPlatesNeeded = (() => {
    if (packagingItemsPerPlate <= 0 || packagingQuantity <= 0) return 0
    return Math.ceil(packagingQuantity / packagingItemsPerPlate)
  })()

  // ── Emballage — matière ──
  const packagingMaterialCost = (() => {
    if (!hasPackaging || !packagingPlate || packagingQuantity <= 0) return 0
    if (packagingWidth <= 0 || packagingHeight <= 0) return 0
    if (packagingItemsPerPlate <= 0) return 0
    return packagingPlatesNeeded * packagingPlate.cost
  })()

  // ── Emballage — découpe ──
  const packagingCuttingCost = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    const totalSeconds = packagingCuttingTimePerPoseSeconds * packagingQuantity + cuttingSetupSeconds
    return (totalSeconds / 3600) * hourlyRatePrint
  })()

  const packagingTotalCost = packagingMaterialCost + packagingCuttingCost

  // ── Total général ──
  const totalCost =
    (impositionResult?.materialCost || 0) +
    printingCost +
    cuttingCost +
    assemblyCost +
    packagingCost +
    accessoriesCost +
    consumablesCost +
    packagingTotalCost

  return {
    printingCostData,
    printingCost,
    cuttingCost,
    assemblyCost,
    packagingCost,
    accessoriesCost,
    consumablesCost,
    totalCost,
    inkVolumeL: printingCostData.inkVolumeL,
    packagingMaterialCost,
    packagingCuttingCost,
    packagingTotalCost,
    packagingItemsPerPlate,
    packagingPlatesNeeded,
  }
}