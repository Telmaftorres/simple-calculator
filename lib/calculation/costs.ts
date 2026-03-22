import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_PACKAGING,
  INK_COST_PER_LITER,
  INK_BASE_ML_PER_PLATE,
  PRINT_SETUP_TIME_MIN,
  PRINT_SPEED_PRODUCTION,
  PRINT_SPEED_QUALITY,
  CUTTING_SETUP_MINUTES,
  FINISHING_SURCHARGE_PERCENT,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
  POSE_SPACING_MM,
  PACKAGING_SETUP_MINUTES,
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

export function calculateCosts(params: {
  quantity: number
  impositionResult: ImpositionResult | null
  selectedPlate: Plate | undefined
  printSurfacePercent: number
  printMode: PrintMode
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  hasPrintSetup: boolean
  hasCuttingSetup: boolean
  hasImpression: boolean
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasAccessoires: boolean
  cuttingTimePerPoseSeconds: number
  assemblyTimePerPieceSeconds: number
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  selectedAccessories: SelectedAccessory[]
  selectedConsumables: SelectedConsumable[]
  settings?: Record<string, number>
  hasPackaging: boolean
  packagingPlate: Plate | undefined
  packagingQuantity: number
  packagingCuttingTimePerPoseSeconds: number
  packagingWidth: number
  packagingHeight: number
}) {
  const {
    quantity,
    impositionResult,
    selectedPlate,
    printSurfacePercent,
    printMode,
    isRectoVerso,
    hasVarnish,
    hasFlatColor,
    hasPrintSetup,
    hasCuttingSetup,
    hasImpression,
    hasFaconnage,
    hasConditionnement,
    hasAccessoires,
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

  const hourlyRatePrint = settings?.HOURLY_RATE_PRINT ?? HOURLY_RATE_PRINT
  const hourlyRateAssembly = settings?.HOURLY_RATE_ASSEMBLY ?? HOURLY_RATE_ASSEMBLY
  const hourlyRatePackaging = settings?.HOURLY_RATE_PACKAGING ?? HOURLY_RATE_PACKAGING
  const inkCostPerLiter = settings?.INK_COST_PER_LITER ?? INK_COST_PER_LITER
  const inkBaseMlPerPlate = settings?.INK_BASE_ML_PER_PLATE ?? INK_BASE_ML_PER_PLATE
  const printSetupTimeMin = settings?.PRINT_SETUP_TIME_MIN ?? PRINT_SETUP_TIME_MIN
  const printSpeedProduction = settings?.PRINT_SPEED_PRODUCTION ?? PRINT_SPEED_PRODUCTION
  const printSpeedQuality = settings?.PRINT_SPEED_QUALITY ?? PRINT_SPEED_QUALITY
  const cuttingSetupMinutes = settings?.CUTTING_SETUP_MINUTES ?? CUTTING_SETUP_MINUTES
  const finishingSurchargePercent = settings?.FINISHING_SURCHARGE_PERCENT ?? FINISHING_SURCHARGE_PERCENT
  const assemblyNoticeCostPerPiece = settings?.ASSEMBLY_NOTICE_COST_PER_PIECE ?? ASSEMBLY_NOTICE_COST_PER_PIECE
  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM
  const packagingSetupMinutes = settings?.PACKAGING_SETUP_MINUTES ?? PACKAGING_SETUP_MINUTES

  // ── Impression ──
  const printingCostData: PrintingCostData = (() => {
    if (!hasImpression || !impositionResult || !selectedPlate)
      return {
        cost: 0,
        timeMin: 0,
        inkCost: 0,
        laborCost: 0,
        inkVolumeL: 0,
        setupCost: 0,
        machineCost: 0,
        setupTimeMin: 0,
        machineTimeMin: 0,
      }

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
    const pace = printMode === 'production' ? printSpeedProduction : printSpeedQuality
    const machineTimeMin = plateAreaM2 * pace * multiplier * impositionResult.platesNeeded

    const setupTimeMin = hasPrintSetup && printSurfacePercent > 0 ? printSetupTimeMin : 0

    const totalTimeMin = machineTimeMin + setupTimeMin
    const machineCost = (machineTimeMin / 60) * hourlyRatePrint
    const setupCost = (setupTimeMin / 60) * hourlyRatePrint
    const laborCost = machineCost + setupCost

    return {
      cost: inkCost + laborCost,
      timeMin: totalTimeMin,
      inkCost,
      laborCost,
      inkVolumeL,
      setupCost,
      machineCost,
      setupTimeMin,
      machineTimeMin,
    }
  })()

  const printingCost = printingCostData.cost

  // ── Découpe ──
  const cuttingMachineTimeMin = impositionResult
    ? (cuttingTimePerPoseSeconds * quantity) / 60
    : 0

  const cuttingSetupTimeMin = (impositionResult && hasCuttingSetup)
    ? cuttingSetupMinutes
    : 0

  const cuttingMachineCost = (cuttingMachineTimeMin / 60) * hourlyRatePrint
  const cuttingSetupCost = (cuttingSetupTimeMin / 60) * hourlyRatePrint
  const cuttingCost = cuttingMachineCost + cuttingSetupCost

  // ── Façonnage ──
  const assemblyCost = (() => {
    if (!hasFaconnage) return 0
    const totalHours = (assemblyTimePerPieceSeconds * quantity) / 3600
    return totalHours * hourlyRateAssembly
  })()

  // ── Conditionnement ──
  const packagingCost = (() => {
    if (!hasConditionnement) return 0
    const totalHours = (packTimePerPieceSeconds * quantity) / 3600
    const timeCost = totalHours * hourlyRateAssembly
    const noticeCost = hasAssemblyNotice ? assemblyNoticeCostPerPiece * quantity : 0
    return timeCost + noticeCost
  })()

  // ── Accessoires ──
  const accessoriesCost = hasAccessoires
    ? selectedAccessories.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0

  const consumablesCost = hasFaconnage
    ? selectedConsumables.reduce(
        (sum, item) => {
          if (item.size <= 0) return sum
          return sum + ((item.sizePerItem * item.quantity) / item.size) * item.price
        },
        0
      )
    : 0

  // ── Emballage — imposition ──
  const packagingItemsPerPlate = (() => {
    if (!hasPackaging || !packagingPlate || packagingWidth <= 0 || packagingHeight <= 0) return 0
    const imp = calculateImposition(
      { width: packagingWidth, height: packagingHeight },
      { width: packagingPlate.width, height: packagingPlate.height },
      poseSpacingMm
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
    if (packagingWidth <= 0 || packagingHeight <= 0 || packagingItemsPerPlate <= 0) return 0
    return packagingPlatesNeeded * packagingPlate.cost
  })()

  // ── Emballage — découpe ──
  const packagingCuttingCost = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    const totalMinutes =
      (packagingCuttingTimePerPoseSeconds * packagingQuantity) / 60 + packagingSetupMinutes
    return (totalMinutes / 60) * hourlyRatePackaging
  })()

  const packagingTotalCost = packagingMaterialCost + packagingCuttingCost

  // ── Total ──
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
    cuttingMachineCost,
    cuttingSetupCost,
    cuttingSetupTimeMin,
    cuttingMachineTimeMin,
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
    poseSpacingMm,
  }
}

// ✅ Type inféré depuis la signature — zéro maintenance
export type CostCalculationParams = Parameters<typeof calculateCosts>[0]