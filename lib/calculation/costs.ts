import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_PACKAGING,
  HOURLY_RATE_BE,
  HOURLY_RATE_BAT,
  HOURLY_RATE_CUTTING,
  HOURLY_RATE_PRINT_COST,
  HOURLY_RATE_CUTTING_COST,
  HOURLY_RATE_ASSEMBLY_COST,
  HOURLY_RATE_CONDITIONING_COST,
  HOURLY_RATE_PACKAGING_COST,
  HOURLY_RATE_BE_COST,
  HOURLY_RATE_BAT_COST,
  INK_COST_PER_LITER,
  INK_COST_VARNISH_PER_LITER,
  INK_COST_FLAT_COLOR_PER_LITER,
  PRINT_SPEED_PRODUCTION,
  PRINT_SPEED_QUALITY,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
  POSE_ETIQUETTE_COST_PER_PIECE,
  POSE_SPACING_MM,
  PLATE_BORDER_MM,
  PACKAGING_SETUP_COST,
  PRINT_SETUP_STANDARD_COST,
  PRINT_SETUP_COMPLEX_COST,
  CUTTING_SETUP_STANDARD_COST,
  CUTTING_SETUP_COMPLEX_COST,
  MATERIAL_MARGIN_TIER1,
  MATERIAL_MARGIN_TIER2,
  MATERIAL_MARGIN_TIER3,
  MATERIAL_MARGIN_TIER4,
  MATERIAL_MARGIN_Q1_P1, MATERIAL_MARGIN_Q1_P2, MATERIAL_MARGIN_Q1_P3,
  MATERIAL_MARGIN_Q2_P1, MATERIAL_MARGIN_Q2_P2, MATERIAL_MARGIN_Q2_P3,
  MATERIAL_MARGIN_Q3_P1, MATERIAL_MARGIN_Q3_P2, MATERIAL_MARGIN_Q3_P3,
  MATERIAL_MARGIN_Q4_P1, MATERIAL_MARGIN_Q4_P2, MATERIAL_MARGIN_Q4_P3,
  INK_MARGIN_STANDARD,
  INK_MARGIN_VARNISH,
  INK_MARGIN_FLAT_COLOR,
  DOSSIER_FEE,
  FOURNITURES_EMB_FEE,
  PALETTE_FEE,
  PROTOTYPE_FORFAIT,
  PROTOTYPE_FOURNITURES_FEE,
  HOURLY_RATE_CONDITIONING,
  TRANSPORT_MARGIN,
  MARGE_COMMERCIALE_PERCENT,
  MARGE_SOPANO_PERCENT,
  PACKAGING_B_PETIT_PRICE,
  PACKAGING_B_MOYEN_PRICE,
  PACKAGING_B_GRAND_PRICE,
  PACKAGING_EB_PETIT_PRICE,
  PACKAGING_EB_MOYEN_PRICE,
  PACKAGING_EB_GRAND_PRICE,
} from '@/lib/config/pricing'

const B_EB_PRICE_DEFAULTS: Record<string, number> = {
  PACKAGING_B_PETIT_PRICE,
  PACKAGING_B_MOYEN_PRICE,
  PACKAGING_B_GRAND_PRICE,
  PACKAGING_EB_PETIT_PRICE,
  PACKAGING_EB_MOYEN_PRICE,
  PACKAGING_EB_GRAND_PRICE,
}
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
  degressiveQuantity?: number
  impositionResult: ImpositionResult | null
  selectedPlate: Plate | undefined
  inkMlPerPlate: number
  varnishSurfacePercent: number
  varnishMlPerPlate?: number
  flatColorSurfacePercent: number
  printMode: PrintMode
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  hasDossierFee?: boolean
  hasFournituresEmb?: boolean
  hasPalette?: boolean
  modePrototype?: boolean
  hasMargeCommerciale?: boolean
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
  hasPoseEtiquette: boolean
  selectedAccessories: SelectedAccessory[]
  selectedConsumables: SelectedConsumable[]
  settings?: Record<string, number>
  hasPackaging: boolean
  packagingMaterialType?: string  // 'B' | 'EB' | 'C' | 'BC'
  packagingExternalSize?: string | null  // 'petit' | 'moyen' | 'grand'
  hasBE?: boolean
  beTimeMinutes?: number
  batTimeMinutes?: number
  packagingPlate: Plate | undefined
  packagingQuantity: number
  packagingCuttingTimePerPoseSeconds: number
  packagingWidth: number
  packagingHeight: number
  transportTotal?: number
  amalgameOverride?: {
    materialCost: number
    machineTimeMin: number
    platesCount: number
  } | null
  machineTimeMinOverride?: number | null
  packagingUnitPriceOverride?: number | null
  accessoriesMargePercent?: number
  packagingMargePercent?: number
}) {
  const {
    quantity,
    impositionResult,
    selectedPlate,
    inkMlPerPlate,
    varnishSurfacePercent,
    varnishMlPerPlate: varnishMlInput = 0,
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
    hasPoseEtiquette,
    selectedAccessories,
    selectedConsumables,
    settings,
    hasPackaging,
    packagingMaterialType = 'BC',
    packagingExternalSize = null,
    hasBE = false,
    beTimeMinutes = 0,
    batTimeMinutes = 0,
    hasDossierFee = false,
    hasFournituresEmb = false,
    hasPalette = false,
    modePrototype = false,
    hasMargeCommerciale = true,
    degressiveQuantity,
    packagingPlate,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth,
    packagingHeight,
    transportTotal,
    amalgameOverride,
    machineTimeMinOverride,
    packagingUnitPriceOverride,
    accessoriesMargePercent,
    packagingMargePercent,
  } = params

  const hourlyRatePrint = settings?.HOURLY_RATE_PRINT ?? HOURLY_RATE_PRINT
  const hourlyRateAssembly = settings?.HOURLY_RATE_ASSEMBLY ?? HOURLY_RATE_ASSEMBLY
  const hourlyRatePackaging = settings?.HOURLY_RATE_PACKAGING ?? HOURLY_RATE_PACKAGING
  const hourlyRateBE = settings?.HOURLY_RATE_BE ?? HOURLY_RATE_BE
  const hourlyRateBAT = settings?.HOURLY_RATE_BAT ?? HOURLY_RATE_BAT
  const hourlyRateConditioning = settings?.HOURLY_RATE_CONDITIONING ?? HOURLY_RATE_CONDITIONING
  const hourlyRateCutting = settings?.HOURLY_RATE_CUTTING ?? HOURLY_RATE_CUTTING
  // ── Taux horaires coûtants (brut) ──
  const hourlyRatePrintCost = settings?.HOURLY_RATE_PRINT_COST ?? HOURLY_RATE_PRINT_COST
  const hourlyRateCuttingCost = settings?.HOURLY_RATE_CUTTING_COST ?? HOURLY_RATE_CUTTING_COST
  const hourlyRateAssemblyCost = settings?.HOURLY_RATE_ASSEMBLY_COST ?? HOURLY_RATE_ASSEMBLY_COST
  const hourlyRateConditioningCost = settings?.HOURLY_RATE_CONDITIONING_COST ?? HOURLY_RATE_CONDITIONING_COST
  const hourlyRatePackagingCost = settings?.HOURLY_RATE_PACKAGING_COST ?? HOURLY_RATE_PACKAGING_COST
  const hourlyRateBECost = settings?.HOURLY_RATE_BE_COST ?? HOURLY_RATE_BE_COST
  const hourlyRateBATCost = settings?.HOURLY_RATE_BAT_COST ?? HOURLY_RATE_BAT_COST
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
  const poseEtiquetteCostPerPiece = settings?.POSE_ETIQUETTE_COST_PER_PIECE ?? POSE_ETIQUETTE_COST_PER_PIECE
  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM
  const plateBorderMm = settings?.PLATE_BORDER_MM ?? PLATE_BORDER_MM
  const packagingSetupCost = settings?.PACKAGING_SETUP_COST ?? PACKAGING_SETUP_COST
  const inkMarginStandard = settings?.INK_MARGIN_STANDARD ?? INK_MARGIN_STANDARD
  const inkMarginVarnish = settings?.INK_MARGIN_VARNISH ?? INK_MARGIN_VARNISH
  const inkMarginFlatColor = settings?.INK_MARGIN_FLAT_COLOR ?? INK_MARGIN_FLAT_COLOR
  const materialMarginTier1 = settings?.MATERIAL_MARGIN_TIER1 ?? MATERIAL_MARGIN_TIER1
  const materialMarginTier2 = settings?.MATERIAL_MARGIN_TIER2 ?? MATERIAL_MARGIN_TIER2
  const materialMarginTier3 = settings?.MATERIAL_MARGIN_TIER3 ?? MATERIAL_MARGIN_TIER3
  const materialMarginTier4 = settings?.MATERIAL_MARGIN_TIER4 ?? MATERIAL_MARGIN_TIER4
  // Matrice matière (prix/m² × quantité) — 12 coeffs réglables
  const mQ1P1 = settings?.MATERIAL_MARGIN_Q1_P1 ?? MATERIAL_MARGIN_Q1_P1
  const mQ1P2 = settings?.MATERIAL_MARGIN_Q1_P2 ?? MATERIAL_MARGIN_Q1_P2
  const mQ1P3 = settings?.MATERIAL_MARGIN_Q1_P3 ?? MATERIAL_MARGIN_Q1_P3
  const mQ2P1 = settings?.MATERIAL_MARGIN_Q2_P1 ?? MATERIAL_MARGIN_Q2_P1
  const mQ2P2 = settings?.MATERIAL_MARGIN_Q2_P2 ?? MATERIAL_MARGIN_Q2_P2
  const mQ2P3 = settings?.MATERIAL_MARGIN_Q2_P3 ?? MATERIAL_MARGIN_Q2_P3
  const mQ3P1 = settings?.MATERIAL_MARGIN_Q3_P1 ?? MATERIAL_MARGIN_Q3_P1
  const mQ3P2 = settings?.MATERIAL_MARGIN_Q3_P2 ?? MATERIAL_MARGIN_Q3_P2
  const mQ3P3 = settings?.MATERIAL_MARGIN_Q3_P3 ?? MATERIAL_MARGIN_Q3_P3
  const mQ4P1 = settings?.MATERIAL_MARGIN_Q4_P1 ?? MATERIAL_MARGIN_Q4_P1
  const mQ4P2 = settings?.MATERIAL_MARGIN_Q4_P2 ?? MATERIAL_MARGIN_Q4_P2
  const mQ4P3 = settings?.MATERIAL_MARGIN_Q4_P3 ?? MATERIAL_MARGIN_Q4_P3
  const dossierFee = settings?.DOSSIER_FEE ?? DOSSIER_FEE
  const fournituresEmbFee = settings?.FOURNITURES_EMB_FEE ?? FOURNITURES_EMB_FEE
  const paletteFee = settings?.PALETTE_FEE ?? PALETTE_FEE
  const prototypeForfait = settings?.PROTOTYPE_FORFAIT ?? PROTOTYPE_FORFAIT
  const prototypeFournituresFee = settings?.PROTOTYPE_FOURNITURES_FEE ?? PROTOTYPE_FOURNITURES_FEE
  const transportMargin = settings?.TRANSPORT_MARGIN ?? TRANSPORT_MARGIN
  const margeCommercialePct = settings?.MARGE_COMMERCIALE_PERCENT ?? MARGE_COMMERCIALE_PERCENT
  const margeSopanoPct = settings?.MARGE_SOPANO_PERCENT ?? MARGE_SOPANO_PERCENT
  // Marge commerciale (2,5 %) optionnelle : retirée si le patron a trouvé le client (Sopano toujours appliquée)
  const commissionDivisor = 1 - (((hasMargeCommerciale ? margeCommercialePct : 0) + margeSopanoPct) / 100)


  // ── Impression ──
  const printingCostData: PrintingCostData = (() => {
    const noImpression = {
      cost: 0, timeMin: 0, inkCost: 0, laborCost: 0, inkVolumeL: 0,
      setupCost: 0, machineCost: 0, setupTimeMin: 0, machineTimeMin: 0,
      inkCostRaw: 0, machineCostBrut: 0, costBrut: 0,
    }
    if (!hasImpression) return noImpression

    // Vernis : on utilise le ml/plaque saisi directement (nouveau champ) ; sinon rétro-compat
    // via l'ancien pourcentage (inkMl × %) → les anciens devis gardent exactement le même coût.
    const effectiveVarnishMlPerPlate = hasVarnish
      ? (varnishMlInput > 0 ? varnishMlInput : inkMlPerPlate * (varnishSurfacePercent / 100))
      : 0

    // ── Mode amalgame : machine time fourni en override ──
    if (amalgameOverride) {
      const platesNeeded = amalgameOverride.platesCount
      const multiplier = isRectoVerso ? 2 : 1
      const flatColorRatio = hasFlatColor ? (flatColorSurfacePercent / 100) : 0
      const standardVolumeL = (inkMlPerPlate * platesNeeded * multiplier) / 1000
      const varnishVolumeL = (effectiveVarnishMlPerPlate * platesNeeded * multiplier) / 1000
      const flatColorVolumeL = (inkMlPerPlate * flatColorRatio * platesNeeded * multiplier) / 1000
      const inkCost = standardVolumeL * inkCostPerLiter * inkMarginStandard
        + varnishVolumeL * inkCostVarnishPerLiter * inkMarginVarnish
        + flatColorVolumeL * inkCostFlatColorPerLiter * inkMarginFlatColor
      const inkCostRaw = standardVolumeL * inkCostPerLiter
        + varnishVolumeL * inkCostVarnishPerLiter
        + flatColorVolumeL * inkCostFlatColorPerLiter
      const machineTimeMin = amalgameOverride.machineTimeMin
      const machineCost = (machineTimeMin / 60) * hourlyRatePrint
      const machineCostBrut = (machineTimeMin / 60) * hourlyRatePrintCost
      const setupCost = printSetupType === 'standard' ? printSetupStandardCost
        : printSetupType === 'complexe' ? printSetupComplexCost : 0
      return {
        cost: inkCost + machineCost + setupCost,
        timeMin: machineTimeMin, inkCost, laborCost: machineCost,
        inkVolumeL: standardVolumeL + varnishVolumeL + flatColorVolumeL,
        setupCost, machineCost, setupTimeMin: 0, machineTimeMin,
        inkCostRaw, machineCostBrut, costBrut: inkCostRaw + machineCostBrut + setupCost,
      }
    }

    if (!impositionResult || !selectedPlate) return noImpression

    const multiplier = isRectoVerso ? 2 : 1
    const platesNeeded = impositionResult.platesNeeded

    const flatColorRatio = hasFlatColor ? (flatColorSurfacePercent / 100) : 0

    const standardMlPerPlate = inkMlPerPlate * 1
    const varnishMlPerPlate = effectiveVarnishMlPerPlate
    const flatColorMlPerPlate = inkMlPerPlate * flatColorRatio

    const standardVolumeL = (standardMlPerPlate * platesNeeded * multiplier) / 1000
    const varnishVolumeL = (varnishMlPerPlate * platesNeeded * multiplier) / 1000
    const flatColorVolumeL = (flatColorMlPerPlate * platesNeeded * multiplier) / 1000
    const totalInkVolumeL = standardVolumeL + varnishVolumeL + flatColorVolumeL

    const standardInkCost = standardVolumeL * inkCostPerLiter * inkMarginStandard
    const varnishInkCost = varnishVolumeL * inkCostVarnishPerLiter * inkMarginVarnish
    const flatColorInkCost = flatColorVolumeL * inkCostFlatColorPerLiter * inkMarginFlatColor
    const inkCost = standardInkCost + varnishInkCost + flatColorInkCost
    // Encre au prix d'achat (sans marge encre) pour le brut
    const inkCostRaw = standardVolumeL * inkCostPerLiter
      + varnishVolumeL * inkCostVarnishPerLiter
      + flatColorVolumeL * inkCostFlatColorPerLiter

    const plateAreaM2 = (selectedPlate.width * selectedPlate.height) / 1000000
    const pace = printMode === 'production' ? printSpeedProduction : printSpeedQuality
    const baseMachineTimeMin = plateAreaM2 * pace * multiplier * platesNeeded

    const printSpeedVarnish = settings?.PRINT_SPEED_VARNISH ?? 1.5
    const printSpeedFlatColor = settings?.PRINT_SPEED_FLAT_COLOR ?? 1.5
    const varnishTimeMin = hasVarnish ? (plateAreaM2 * printSpeedVarnish * multiplier * platesNeeded) : 0
    const flatColorTimeMin = hasFlatColor ? (plateAreaM2 * printSpeedFlatColor * multiplier * platesNeeded) : 0

    const autoMachineTimeMin = baseMachineTimeMin + varnishTimeMin + flatColorTimeMin
    const machineTimeMin = (machineTimeMinOverride != null && machineTimeMinOverride > 0)
      ? machineTimeMinOverride
      : autoMachineTimeMin
    const machineCost = (machineTimeMin / 60) * hourlyRatePrint
    const machineCostBrut = (machineTimeMin / 60) * hourlyRatePrintCost

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
      inkCostRaw,
      machineCostBrut,
      costBrut: inkCostRaw + machineCostBrut + setupCost,
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
  // Brut : temps découpe × taux coûtant (le calage reste un forfait, identique)
  const cuttingMachineCostBrut = (cuttingMachineTimeMin / 60) * hourlyRateCuttingCost
  const cuttingCostBrut = cuttingMachineCostBrut + cuttingSetupCost

  // ── Façonnage ──
  const assemblyCost = (() => {
    if (!hasFaconnage) return 0
    const totalHours = (assemblyTimePerPieceSeconds * quantity) / 3600
    return totalHours * hourlyRateAssembly
  })()
  const assemblyCostBrut = (() => {
    if (!hasFaconnage) return 0
    const totalHours = (assemblyTimePerPieceSeconds * quantity) / 3600
    return totalHours * hourlyRateAssemblyCost
  })()

  // ── Conditionnement ──
  const packagingCost = (() => {
    if (!hasConditionnement) return 0
    const totalHours = (packTimePerPieceSeconds * quantity) / 3600
    const timeCost = totalHours * hourlyRateConditioning
    const noticeCost = hasAssemblyNotice ? assemblyNoticeCostPerPiece * quantity : 0
    const etiquetteCost = hasPoseEtiquette ? poseEtiquetteCostPerPiece * quantity : 0
    return timeCost + noticeCost + etiquetteCost
  })()
  const packagingCostBrut = (() => {
    if (!hasConditionnement) return 0
    const totalHours = (packTimePerPieceSeconds * quantity) / 3600
    const timeCost = totalHours * hourlyRateConditioningCost
    // Notices & étiquettes sont des coûts réels par pièce → conservés au brut
    const noticeCost = hasAssemblyNotice ? assemblyNoticeCostPerPiece * quantity : 0
    const etiquetteCost = hasPoseEtiquette ? poseEtiquetteCostPerPiece * quantity : 0
    return timeCost + noticeCost + etiquetteCost
  })()

  // ── Accessoires ──
  const accessoriesCost = hasAccessoires
    ? selectedAccessories.reduce((sum, item) => sum + item.price * item.quantity, 0) * ((accessoriesMargePercent ?? 0) > 0 ? accessoriesMargePercent! : 1)
    : 0
  // Brut : prix d'achat des accessoires, sans coefficient de marge
  const accessoriesCostBrut = hasAccessoires
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
  const isExternalPackaging = packagingMaterialType === 'B' || packagingMaterialType === 'EB'

  // Imposition C/BC
  const packagingItemsPerPlate = (() => {
    if (!hasPackaging || isExternalPackaging) return 0
    if (!packagingPlate || packagingWidth <= 0 || packagingHeight <= 0) return 0
    const imp = calculateImposition(
      { width: packagingWidth, height: packagingHeight },
      { width: packagingPlate.width, height: packagingPlate.height },
      poseSpacingMm,
      undefined,
      plateBorderMm
    )
    return imp.itemsPerPlate
  })()

  const packagingPlatesNeeded = (() => {
    if (packagingItemsPerPlate <= 0 || packagingQuantity <= 0) return 0
    return Math.ceil(packagingQuantity / packagingItemsPerPlate)
  })()

  const packagingMaterialMarginCoeff = (() => {
    if (!packagingPlate) return 1
    if (packagingPlate.cost < 5) return materialMarginTier1
    if (packagingPlate.cost < 10) return materialMarginTier2
    if (packagingPlate.cost < 20) return materialMarginTier3
    return materialMarginTier4
  })()

  // Prix unitaire B/EB (depuis settings ou config)
  const packagingExternalUnitPrice = (() => {
    if (!isExternalPackaging || !packagingExternalSize) return 0
    const mat = packagingMaterialType!.toUpperCase()
    const sz = packagingExternalSize.toUpperCase()
    const key = `PACKAGING_${mat}_${sz}_PRICE`
    return settings?.[key] ?? B_EB_PRICE_DEFAULTS[key] ?? 0
  })()

  const effectivePackagingUnitPrice = (packagingUnitPriceOverride != null && packagingUnitPriceOverride > 0)
    ? packagingUnitPriceOverride
    : packagingExternalUnitPrice

  const packagingMaterialCost = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    if (isExternalPackaging) return effectivePackagingUnitPrice * packagingQuantity
    if (!packagingPlate || packagingWidth <= 0 || packagingHeight <= 0 || packagingItemsPerPlate <= 0) return 0
    return packagingPlatesNeeded * packagingPlate.cost * packagingMaterialMarginCoeff
  })()

  const packagingCuttingCost = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    if (isExternalPackaging) return 0  // Pas de découpe pour B/EB
    const machineMinutes = (packagingCuttingTimePerPoseSeconds * packagingQuantity) / 60
    return (machineMinutes / 60) * hourlyRatePackaging + packagingSetupCost
  })()

  const packagingTotalCost = (packagingMaterialCost + packagingCuttingCost) * ((packagingMargePercent ?? 0) > 0 ? packagingMargePercent! : 1)

  // ── Emballage brut (sans coeff matière, sans marge %) ──
  // NB B/EB externe : le prix unitaire fournisseur peut inclure un coefficient de bande appliqué en amont.
  const packagingMaterialCostBrut = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    if (isExternalPackaging) return effectivePackagingUnitPrice * packagingQuantity
    if (!packagingPlate || packagingWidth <= 0 || packagingHeight <= 0 || packagingItemsPerPlate <= 0) return 0
    return packagingPlatesNeeded * packagingPlate.cost
  })()
  const packagingCuttingCostBrut = (() => {
    if (!hasPackaging || packagingQuantity <= 0) return 0
    if (isExternalPackaging) return 0
    const machineMinutes = (packagingCuttingTimePerPoseSeconds * packagingQuantity) / 60
    return (machineMinutes / 60) * hourlyRatePackagingCost + packagingSetupCost
  })()
  const packagingTotalCostBrut = packagingMaterialCostBrut + packagingCuttingCostBrut

  // ── Bureau d'études ──
  // En Mode Prototype, le poste BE (+ BAT) est écrasé par le forfait prototype
  const beCost = (hasBE && !modePrototype) ? (beTimeMinutes / 60) * hourlyRateBE : 0
  const batCost = (hasBE && !modePrototype) ? (batTimeMinutes / 60) * hourlyRateBAT : 0
  const beTotalCost = beCost + batCost
  const beCostBrut = (hasBE && !modePrototype) ? (beTimeMinutes / 60) * hourlyRateBECost : 0
  const batCostBrut = (hasBE && !modePrototype) ? (batTimeMinutes / 60) * hourlyRateBATCost : 0
  const beTotalCostBrut = beCostBrut + batCostBrut

// ── Coefficient matière ──
// Coeff matière = matrice (prix au m² × quantité totale du devis)
const degressiveQty = degressiveQuantity ?? quantity
const materialMarginCoeff = (() => {
  if (!selectedPlate) return 1
  const areaM2 = (selectedPlate.width * selectedPlate.height) / 1_000_000
  const pricePerM2 = areaM2 > 0 ? selectedPlate.cost / areaM2 : selectedPlate.cost
  const col = pricePerM2 <= 8 ? 0 : pricePerM2 <= 20 ? 1 : 2                                  // ≤8 · 8-20 · >20 €/m²
  const row = degressiveQty <= 5 ? 0 : degressiveQty <= 50 ? 1 : degressiveQty <= 200 ? 2 : 3 // 1-5 · 6-50 · 51-200 · >201
  const matrix = [
    [mQ1P1, mQ1P2, mQ1P3],
    [mQ2P1, mQ2P2, mQ2P3],
    [mQ3P1, mQ3P2, mQ3P3],
    [mQ4P1, mQ4P2, mQ4P3],
  ]
  return matrix[row][col]
})()

const materialCostRaw = amalgameOverride
  ? amalgameOverride.materialCost
  : (impositionResult?.materialCost || 0)
const materialCostMarged = materialCostRaw * materialMarginCoeff

// ── Frais fixes (dossier, fournitures emballage, palette) + Mode Prototype ──
// Prototype : dossier écrasé (→ forfait), fournitures réduites à 10 €
const dossierFeeCost = (hasDossierFee && !modePrototype) ? dossierFee : 0
const effectiveFournituresFee = modePrototype ? prototypeFournituresFee : fournituresEmbFee
// En Mode Prototype, le forfait fournitures (10 €) s'applique automatiquement (toggle masqué, conforme CDC)
const fournituresEmbCost = (hasFournituresEmb || modePrototype) ? effectiveFournituresFee : 0
const paletteCost = hasPalette ? paletteFee : 0
// Forfait prototype (écrase le cumul BE + frais de dossier)
const prototypeFeeCost = modePrototype ? prototypeForfait : 0

  // ── Transport (avec marge) ──
  const transportCostMarged = (transportTotal ?? 0) * transportMargin

  // ── Total ──
  // ── Prix de vente : /0,925 pour intégrer les commissions (marge commerciale 2,5 % + Sopano 5 %) — CDC brique 3 ──
  const totalCostBeforeCommission =
    dossierFeeCost +
    fournituresEmbCost +
    paletteCost +
    prototypeFeeCost +
    materialCostMarged +
    printingCost +
    cuttingCost +
    assemblyCost +
    packagingCost +
    accessoriesCost +
    consumablesCost +
    packagingTotalCost +
    beTotalCost +
    transportCostMarged
  const totalCost = commissionDivisor > 0 ? totalCostBeforeCommission / commissionDivisor : totalCostBeforeCommission
  const commissionCost = totalCost - totalCostBeforeCommission

  // ── Total brut (coût de revient réel) ──
  const printingCostBrut = printingCostData.costBrut ?? 0
  const totalCostBrut =
    dossierFeeCost +
    fournituresEmbCost +
    paletteCost +
    prototypeFeeCost +
    materialCostRaw +
    printingCostBrut +
    cuttingCostBrut +
    assemblyCostBrut +
    packagingCostBrut +
    accessoriesCostBrut +
    consumablesCost +
    packagingTotalCostBrut +
    beTotalCostBrut +
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
    commissionCost,
    inkVolumeL: printingCostData.inkVolumeL,
    packagingMaterialCost,
    packagingCuttingCost,
    packagingTotalCost,
    packagingItemsPerPlate,
    packagingPlatesNeeded,
    packagingExternalUnitPrice,
    effectivePackagingUnitPrice,
    poseSpacingMm,
    assemblyNoticeCostPerPiece,
    poseEtiquetteCostPerPiece,
    materialCostRaw,
    materialCostMarged,
    materialMarginCoeff,
    dossierFeeCost,
    fournituresEmbCost,
    paletteCost,
    prototypeFeeCost,
    beCost,
    batCost,
    beTotalCost,
    transportTotal: transportTotal ?? 0,
    transportCostMarged,
    transportMargin,
    accessoriesMargePercent: accessoriesMargePercent ?? 0,
    packagingMargePercent: packagingMargePercent ?? 0,
    // ── Brut (coût de revient, hors marge) ──
    totalCostBrut,
    printingCostBrut,
    cuttingMachineCostBrut,
    cuttingCostBrut,
    assemblyCostBrut,
    packagingCostBrut,
    accessoriesCostBrut,
    packagingMaterialCostBrut,
    packagingCuttingCostBrut,
    packagingTotalCostBrut,
    beCostBrut,
    batCostBrut,
    beTotalCostBrut,
  }
}

export type CostCalculationParams = Parameters<typeof calculateCosts>[0]
