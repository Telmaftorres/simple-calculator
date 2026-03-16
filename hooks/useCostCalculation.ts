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
import type { ImpositionResult, SelectedAccessory, SelectedConsumable, PrintingCostData, Plate, PrintMode } from '@/types/calculator'

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
  } = params

  const printingCostData: PrintingCostData = (() => {
    if (!impositionResult || !selectedPlate)
      return { cost: 0, timeMin: 0, inkCost: 0, laborCost: 0 }

    const multiplier = isRectoVerso ? 2 : 1
    const inkVolumeL =
      ((impositionResult.platesNeeded * INK_BASE_ML_PER_PLATE * ((printSurfacePercent / 100) * 2)) / 1000) *
      multiplier

    // +5% par option activée (cumulables)
    const finishingMultiplier =
      1 + (hasVarnish ? FINISHING_SURCHARGE_PERCENT : 0) + (hasFlatColor ? FINISHING_SURCHARGE_PERCENT : 0)
    const inkCost = inkVolumeL * INK_COST_PER_LITER * finishingMultiplier

    const plateAreaM2 = (selectedPlate.width * selectedPlate.height) / 1000000
    const printedAreaM2 = plateAreaM2 * (printSurfacePercent / 100)
    const pace = printMode === 'production' ? 1 : 2
    const timePerPlateMin = printedAreaM2 * pace * multiplier
    const setupTimeMin = printSurfacePercent > 0 ? PRINT_SETUP_TIME_MIN : 0
    const totalTimeMin = timePerPlateMin * impositionResult.platesNeeded + setupTimeMin

    const laborCost = (totalTimeMin / 60) * HOURLY_RATE_PRINT

    return { cost: inkCost + laborCost, timeMin: totalTimeMin, inkCost, laborCost }
  })()

  const printingCost = printingCostData.cost

  const cuttingCost = (() => {
    if (!impositionResult) return 0
    const totalSeconds = cuttingTimePerPoseSeconds * quantity + CUTTING_SETUP_SECONDS
    const totalHours = totalSeconds / 3600
    return totalHours * HOURLY_RATE_PRINT
  })()

  const assemblyCost = (() => {
    const totalHours = (assemblyTimePerPieceSeconds * quantity) / 3600
    return totalHours * HOURLY_RATE_ASSEMBLY
  })()

  const packagingCost = (() => {
    const totalHours = (packTimePerPieceSeconds * quantity) / 3600
    const timeCost = totalHours * HOURLY_RATE_ASSEMBLY
    const noticeCost = hasAssemblyNotice ? ASSEMBLY_NOTICE_COST_PER_PIECE * quantity : 0
    return timeCost + noticeCost
  })()

  const accessoriesCost = selectedAccessories.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const consumablesCost = selectedConsumables.reduce(
    (sum, item) => sum + ((item.sizePerItem * item.quantity) / item.size) * item.price,
    0
  )

  const totalCost =
    (impositionResult?.materialCost || 0) +
    printingCost +
    cuttingCost +
    assemblyCost +
    packagingCost +
    accessoriesCost +
    consumablesCost

  return {
    printingCostData,
    printingCost,
    cuttingCost,
    assemblyCost,
    packagingCost,
    accessoriesCost,
    consumablesCost,
    totalCost,
  }
}
