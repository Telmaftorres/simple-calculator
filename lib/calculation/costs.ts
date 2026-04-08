import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_PACKAGING,
  HOURLY_RATE_BE,
  HOURLY_RATE_BAT,
  HOURLY_RATE_CUTTING,
  INK_COST_PER_LITER,
  INK_COST_VARNISH_PER_LITER,
  INK_COST_FLAT_COLOR_PER_LITER,
  PRINT_SPEED_PRODUCTION,
  PRINT_SPEED_QUALITY,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
  POSE_SPACING_MM,
  PACKAGING_SETUP_COST,
  PRINT_SETUP_STANDARD_COST,
  PRINT_SETUP_COMPLEX_COST,
  CUTTING_SETUP_STANDARD_COST,
  CUTTING_SETUP_COMPLEX_COST,
  MATERIAL_MARGIN_TIER1,
  MATERIAL_MARGIN_TIER2,
  MATERIAL_MARGIN_TIER3,
  MATERIAL_MARGIN_TIER4,
  DOSSIER_FEE,
  HOURLY_RATE_CONDITIONING,
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
  inkMlPerPlate: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  printMode: PrintMode
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  hasDossierFee?: boolean
  printSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupType: 'none' | 'standard' | 'complexe'
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
  hasBE?: boolean
  beTimeMinutes?: number
  batTimeMinutes?: number
  packagingPlate: Plate | undefined
  packagingQuantity: number
  packagingCuttingTimePerPoseSeconds: number
  packagingWidth: number
  packagingHeight: number
  transportTotal?: number
}) {
  const {
    quantity,
    impositionResult,
    selectedPlate,
    inkMlPerPlate,
    varnishSurfacePercent,
    flatColorSurfacePercent,
    printMode,
    isRectoVerso,
    hasVarnish,
    hasFlatColor,
    printSetupType,
    cuttingSetupType,
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
    hasBE = false,
    beTimeMinutes = 0,
    batTimeMinutes = 0,
    hasDossierFee = false,
    packagingPlate,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth,
    packagingHeight,
    transportTotal,
  } = params

  const hourlyRatePrint = settings?.HOURLY_RATE_PRINT ?? HOURLY_RATE_PRINT
  const hourlyRateAssembly = settings?.HOURLY_RATE_ASSEMBLY ?? HOURLY_RATE_ASSEMBLY
  const hourlyRatePackaging = settings?.HOURLY_RATE_PACKAGING ?? HOURLY_RATE_PACKAGING
  const hourlyRateBE = settings?.HOURLY_RATE_BE ?? HOURLY_RATE_BE
  const hourlyRateBAT = settings?.HOURLY_RATE_BAT ?? HOURLY_RATE_BAT
  const hourlyRateConditioning = settings?.HOURLY_RATE_CONDITIONING ?? HOURLY_RATE_CONDITIONING
  const hourlyRateCutting = settings?.HOURLY_RATE_CUTTING ?? HOURLY_RATE_CUTTING
  const inkCostPerLiter = settings?.INK_COST_PER_LITER ?? INK_COST_PER_LITER
  const inkCostVarnishPerLiter = settings?.INK_COST_VARNISH_PER_LITER ?? INK_COST_VARNISH_PER_LITER
  const inkCostFlatColorPerLiter = settings?.INK_COST_FLAT_COLOR_PER_LITER ?? INK_COST_FLAT_COLOR_PER_LITER
  const printSpeedProduction = settings?.PRINT_SPEED_PRODUCTION ?? PRINT_SPEED_PRODUCTION
  const printSpeedQuality = settings?.PRINT_SPEED_QUALITY ?? PRINT_SPEED_QUALITY
  const printSetupStandardCost = settings?.PRINT_SETUP_STANDARD_COST ?? PRINT_SETUP_STANDARD_COST
  const printSetupComplexCost = settings?.PRINT_SETUP_COMPLEX_COST ?? PRINT_SETUP_COMPLEX_COST
  const cuttingSetupStandardCost = settings?.CUTTING_SETUP_STANDARD_COST ?? CUTTING_SETUP_STANDARD_COST
  const cuttingSetupComplexCost = settings?.CUTTING_SETUP_COMPLEX_COST ?? CUTTING_SETUP_COMPLEX_COST
  const assemblyNoticeCostPerPiece = settings?.ASSEMBLY_NOTICE_COST_PER_PIECE ?? ASSEMBLY_NOTICE_COST_PER_PIECE
  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM
  const packagingSetupCost = settings?.PACKAGING_SETUP_COST ?? PACKAGING_SETUP_COST
  const materialMarginTier1 = settings?.MATERIAL_MARGIN_TIER1 ?? MATERIAL_MARGIN_TIER1
  const materialMarginTier2 = settings?.MATERIAL_MARGIN_TIER2 ?? MATERIAL_MARGIN_TIER2
  const materialMarginTier3 = settings?.MATERIAL_MARGIN_TIER3 ?? MATERIAL_MARGIN_TIER3
  const materialMarginTier4 = settings?.MATERIAL_MARGIN_TIER4 ?? MATERIAL_MARGIN_TIER4
  const dossierFee = settings?.DOSSIER_FEE ?? DOSSIER_FEE


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
    const platesNeeded = impositionResult.platesNeeded

    const varnishRatio = hasVarnish ? (varnishSurfacePercent / 100) : 0
    const flatColorRatio = hasFlatColor ? (flatColorSurfacePercent / 100) : 0

    const standardMlPerPlate = inkMlPerPlate * 1
    const varnishMlPerPlate = inkMlPerPlate * varnishRatio
    const flatColorMlPerPlate = inkMlPerPlate * flatColorRatio

    const standardVolumeL = (standardMlPerPlate * platesNeeded * multiplier) / 1000
    const varnishVolumeL = (varnishMlPerPlate * platesNeeded * multiplier) / 1000
    const flatColorVolumeL = (flatColorMlPerPlate * platesNeeded * multiplier) / 1000
    const totalInkVolumeL = standardVolumeL + varnishVolumeL + flatColorVolumeL

    const standardInkCost = standardVolumeL * inkCostPerLiter
    const varnishInkCost = varnishVolumeL * inkCostVarnishPerLiter
    const flatColorInkCost = flatColorVolumeL * inkCostFlatColorPerLiter
    const inkCost = standardInkCost + varnishInkCost + flatColorInkCost

    const plateAreaM2 = (selectedPlate.width * selectedPlate.height) / 1000000
    const pace = printMode === 'production' ? printSpeedProduction : printSpeedQuality
    const baseMachineTimeMin = plateAreaM2 * pace * multiplier * platesNeeded

    const printSpeedVarnish = settings?.PRINT_SPEED_VARNISH ?? 1.5
    const printSpeedFlatColor = settings?.PRINT_SPEED_FLAT_COLOR ?? 1.5
    const varnishTimeMin = hasVarnish ? (plateAreaM2 * printSpeedVarnish * multiplier * platesNeeded) : 0
    const flatColorTimeMin = hasFlatColor ? (plateAreaM2 * printSpeedFlatColor * multiplier * platesNeeded) : 0

    const machineTimeMin = baseMachineTimeMin + varnishTimeMin + flatColorTimeMin
    const machineCost = (machineTimeMin / 60) * hourlyRatePrint


    const setupCost = (() => {
      if (printSetupType === 'standard') return printSetupStandardCost
      if (printSetupType === 'complexe') return printSetupComplexCost
      return 0
    })()

    return {
      cost: inkCost + machineCost + setupCost,
      timeMin: machineTimeMin,
      inkCost,
      laborCost: machineCost,
      inkVolumeL: totalInkVolumeL,
      setupCost,
      machineCost,
      setupTimeMin: 0,
      machineTimeMin,
    }
  })()

  const printingCost = printingCostData.cost

  // ── Découpe ──
  const cuttingMachineTimeMin = impositionResult
    ? (cuttingTimePerPoseSeconds * quantity) / 60
    : 0

  const cuttingSetupCost = (() => {
    if (!impositionResult) return 0
    if (cuttingSetupType === 'standard') return cuttingSetupStandardCost
    if (cuttingSetupType === 'complexe') return cuttingSetupComplexCost
    return 0
  })()

  const cuttingSetupTimeMin = 0
  const cuttingMachineCost = (cuttingMachineTimeMin / 60) * hourlyRateCutting
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
    const timeCost = totalHours * hourlyRateConditioning
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

  // ── Emballage ──
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

  const packagingMaterialCost = (() => {
    if (!hasPackaging || !packagingPlate || packagingQuantity <= 0) return 0
    if (packagingWidth <= 0 || packagingHeight <= 0 || packagingItemsPerPlate <= 0) return 0
    return packagingPlatesNeeded * packagingPlate.cost
  })()

  const packagingCuttingCost = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    const machineMinutes = (packagingCuttingTimePerPoseSeconds * packagingQuantity) / 60
    return (machineMinutes / 60) * hourlyRatePackaging + packagingSetupCost
  })()

  const packagingTotalCost = packagingMaterialCost + packagingCuttingCost

  // ── Bureau d'études ──
  const beCost = hasBE ? (beTimeMinutes / 60) * hourlyRateBE : 0
  const batCost = hasBE ? (batTimeMinutes / 60) * hourlyRateBAT : 0
  const beTotalCost = beCost + batCost

// ── Coefficient matière ──
const materialCostPerM2 = selectedPlate
  ? selectedPlate.cost / ((selectedPlate.width * selectedPlate.height) / 1000000)
  : 0

const materialMarginCoeff = (() => {
  if (!selectedPlate) return 1
  if (materialCostPerM2 < 5) return materialMarginTier1
  if (materialCostPerM2 < 10) return materialMarginTier2
  if (materialCostPerM2 < 20) return materialMarginTier3
  return materialMarginTier4
})()

const materialCostRaw = impositionResult?.materialCost || 0
const materialCostMarged = materialCostRaw * materialMarginCoeff

// ── Frais de dossier ──
const dossierFeeCost = hasDossierFee ? dossierFee : 0

  // ── Total ──
  const totalCost =
    dossierFeeCost +  
    materialCostMarged +
    printingCost +
    cuttingCost +
    assemblyCost +
    packagingCost +
    accessoriesCost +
    consumablesCost +
    packagingTotalCost +
    beTotalCost +
    (transportTotal ?? 0)

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
    assemblyNoticeCostPerPiece,
    materialCostRaw,
    materialCostMarged,
    materialMarginCoeff,
    dossierFeeCost,
    beCost,
    batCost,
    beTotalCost,
    transportTotal: transportTotal ?? 0,
  }
}

export type CostCalculationParams = Parameters<typeof calculateCosts>[0]