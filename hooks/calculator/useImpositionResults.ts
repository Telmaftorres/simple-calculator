'use client'

import { useMemo } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { calculateCosts } from '@/lib/calculation/costs'
import { calculateMultiImposition } from '@/lib/calculation/amalgame-multi-imposition'
import { HOURLY_RATE_CUTTING, CUTTING_SETUP_STANDARD_COST, CUTTING_SETUP_COMPLEX_COST } from '@/lib/config/pricing'
import type { AmalgameGroup, AmalgameGroupResult, Plate, ProductSlot, ProductSlotResult, ImpositionResult } from '@/types/calculator'
import { resolveVerso } from './utils'

interface ImpositionResultsParams {
  isMultiProduct: boolean
  amalgameGroups: AmalgameGroup[]
  products: ProductSlot[]
  plates: Plate[]
  settings?: Record<string, number>
  poseSpacingMm: number
  plateBorderMm: number
}

function computeGroupResult(
  group: AmalgameGroup,
  products: ProductSlot[],
  plates: Plate[],
  settings: Record<string, number> | undefined,
  poseSpacingMm: number,
  plateBorderMm: number,
): AmalgameGroupResult {
  const empty: AmalgameGroupResult = {
    groupId: group.id, platesCount: 0, materialCostRaw: 0, materialCostMarged: 0,
    machineTimeMin: 0, printingCost: 0, cuttingMachineTimeMin: 0, cuttingMachineCost: 0,
    cuttingSetupCost: 0, totalCost: 0, multiImposition: null,
  }
  const slotsInGroup = products.filter((s) => s.amalgameGroupId === group.id)
  if (slotsInGroup.length === 0) return empty

  const plate = plates.find((p) => p.id.toString() === group.plateId)
  if (!plate) return empty

  const multiImpProducts = slotsInGroup.map((s) => ({
    name: s.productSearch || s.id,
    width: s.flatWidth,
    height: s.flatHeight,
    quantity: s.quantity,
  }))
  const multiImp = multiImpProducts.every((p) => p.width > 0 && p.height > 0 && p.quantity > 0)
    ? calculateMultiImposition(multiImpProducts, plate, poseSpacingMm, plateBorderMm)
    : null

  const isCustomLayout = slotsInGroup.every((s) => s.countPerPlateInGroup > 0)
  const platesCount = isCustomLayout
    ? Math.max(...slotsInGroup.map((s) => Math.ceil(s.quantity / s.countPerPlateInGroup)))
    : (multiImp?.feasible)
      ? multiImp.platesNeeded
      : Math.max(...slotsInGroup.map((s) => {
          let cpp = 1
          if (s.flatWidth > 0 && s.flatHeight > 0) {
            const imp = calculateImposition(
              { width: s.flatWidth, height: s.flatHeight },
              { width: plate.width, height: plate.height },
              poseSpacingMm, undefined, plateBorderMm
            )
            if (imp.itemsPerPlate > 0) cpp = imp.itemsPerPlate
          }
          return Math.ceil(s.quantity / cpp)
        }))

  const cuttingMachineTimeMin = platesCount > 0 ? (platesCount * group.cuttingTimePerPoseSeconds) / 60 : 0
  const cuttingMachineCost = cuttingMachineTimeMin * (settings?.HOURLY_RATE_CUTTING ?? HOURLY_RATE_CUTTING)
  const cuttingSetupCost = group.cuttingSetupType === 'standard'
    ? (settings?.CUTTING_SETUP_STANDARD_COST ?? CUTTING_SETUP_STANDARD_COST)
    : group.cuttingSetupType === 'complexe'
      ? (settings?.CUTTING_SETUP_COMPLEX_COST ?? CUTTING_SETUP_COMPLEX_COST)
      : 0
  const cuttingTotal = cuttingMachineCost + cuttingSetupCost

  if (group.amalgameType === 'decoupe') {
    return { ...empty, platesCount, cuttingMachineTimeMin, cuttingMachineCost, cuttingSetupCost, totalCost: cuttingTotal, multiImposition: multiImp }
  }

  const { effectiveInkMl: groupEffectiveInkMl, effectiveIsRectoVerso: groupEffectiveIsRectoVerso } =
    resolveVerso(group.isRectoVerso, group.rectoVersoType, group.inkMlPerPlate, group.inkMlVerso)
  const groupImposition: ImpositionResult = {
    itemsPerPlate: 1,
    platesNeeded: platesCount,
    materialCost: platesCount * plate.cost,
    orientation: 'normal',
    layout: [],
  }
  const groupCosts = calculateCosts({
    quantity: Math.max(...slotsInGroup.map((s) => s.quantity)),
    impositionResult: groupImposition,
    selectedPlate: plate,
    inkMlPerPlate: groupEffectiveInkMl,
    isRectoVerso: groupEffectiveIsRectoVerso,
    varnishSurfacePercent: group.varnishSurfacePercent,
    flatColorSurfacePercent: group.flatColorSurfacePercent,
    hasVarnish: group.hasVarnish,
    hasFlatColor: group.hasFlatColor,
    printMode: group.printMode,
    printSetupType: group.printSetupType,
    hasImpression: true,
    cuttingSetupType: group.cuttingSetupType,
    cuttingTimePerPoseSeconds: group.cuttingTimePerPoseSeconds,
    hasFaconnage: false, hasConditionnement: false, hasAccessoires: false,
    assemblyTimePerPieceSeconds: 0, packTimePerPieceSeconds: 0, hasAssemblyNotice: false,
    selectedAccessories: [], selectedConsumables: [], settings,
    hasPackaging: false, packagingPlate: undefined, packagingQuantity: 0,
    packagingCuttingTimePerPoseSeconds: 20, packagingWidth: 0, packagingHeight: 0,
    hasDossierFee: false,
  })
  return {
    groupId: group.id,
    platesCount,
    materialCostRaw: groupCosts.materialCostRaw,
    materialCostMarged: groupCosts.materialCostMarged,
    machineTimeMin: groupCosts.printingCostData.machineTimeMin,
    printingCost: groupCosts.printingCost,
    cuttingMachineTimeMin: groupCosts.cuttingMachineTimeMin,
    cuttingMachineCost: groupCosts.cuttingMachineCost,
    cuttingSetupCost: groupCosts.cuttingSetupCost,
    totalCost: groupCosts.totalCost,
    multiImposition: multiImp,
  }
}

export function useImpositionResults({
  isMultiProduct,
  amalgameGroups,
  products,
  plates,
  settings,
  poseSpacingMm,
  plateBorderMm,
}: ImpositionResultsParams) {
  return useMemo(() => {
    if (!isMultiProduct) return { amalgameGroupResults: [] as AmalgameGroupResult[], productSlotResults: [] as ProductSlotResult[] }

    // Step 1: compute group results first so we know the optimized platesCount per group
    const amalgameGroupResults = amalgameGroups.map((group) =>
      computeGroupResult(group, products, plates, settings, poseSpacingMm, plateBorderMm)
    )

    // Map groupId → optimized platesCount for use in per-slot imposition
    const groupPlatesMap = new Map(amalgameGroupResults.map((r) => [r.groupId, r.platesCount]))

    // Step 2: compute per-slot results, using the group's platesCount for grouped slots
    const productSlotResults: ProductSlotResult[] = products.map((slot) => {
      const group = slot.amalgameGroupId ? amalgameGroups.find((g) => g.id === slot.amalgameGroupId) : undefined
      const isInImpressionGroup = group?.amalgameType === 'impression_decoupe'
      const isInDecoupeGroup = group?.amalgameType === 'decoupe'

      let slotImposition: ImpositionResult | null = null

      if (isInImpressionGroup) {
        const groupPlate = plates.find((p) => p.id.toString() === group!.plateId)
        if (groupPlate && slot.flatWidth > 0 && slot.flatHeight > 0 && slot.quantity > 0) {
          const imp = calculateImposition(
            { width: slot.flatWidth, height: slot.flatHeight },
            { width: groupPlate.width, height: groupPlate.height },
            poseSpacingMm, undefined, plateBorderMm
          )
          const cpp = imp.itemsPerPlate > 0 ? imp.itemsPerPlate : 1
          // Use the group's optimized plate count, not the individual slot's naive count
          const groupPlatesCount = groupPlatesMap.get(group!.id) ?? Math.ceil(slot.quantity / cpp)
          slotImposition = {
            itemsPerPlate: cpp,
            platesNeeded: groupPlatesCount,
            materialCost: 0,
            orientation: imp.orientation,
            layout: imp.layout,
          }
        }
      } else {
        const slotPlate = plates.find((p) => p.id.toString() === slot.selectedPlateId)
        if (slotPlate && slot.flatWidth > 0 && slot.flatHeight > 0 && slot.quantity > 0) {
          const imp = calculateImposition(
            { width: slot.flatWidth, height: slot.flatHeight },
            { width: slotPlate.width, height: slotPlate.height },
            poseSpacingMm,
            slot.orientationOverride ?? undefined,
            plateBorderMm
          )
          const platesNeeded = imp.itemsPerPlate > 0 ? Math.ceil(slot.quantity / imp.itemsPerPlate) : 0
          slotImposition = {
            itemsPerPlate: imp.itemsPerPlate,
            platesNeeded,
            materialCost: platesNeeded * slotPlate.cost,
            orientation: imp.orientation,
            layout: imp.layout,
          }
        }
      }

      const plate = isInImpressionGroup ? undefined : plates.find((p) => p.id.toString() === slot.selectedPlateId)
      const { effectiveInkMl: slotEffectiveInkMl, effectiveIsRectoVerso: slotEffectiveIsRectoVerso } =
        resolveVerso(slot.isRectoVerso, slot.rectoVersoType, slot.inkMlPerPlate, slot.inkMlVerso)

      const slotCosts = calculateCosts({
        quantity: slot.quantity,
        impositionResult: slotImposition,
        selectedPlate: plate,
        inkMlPerPlate: isInImpressionGroup ? 0 : slotEffectiveInkMl,
        varnishSurfacePercent: isInImpressionGroup ? 0 : slot.varnishSurfacePercent,
        flatColorSurfacePercent: isInImpressionGroup ? 0 : slot.flatColorSurfacePercent,
        printMode: slot.printMode,
        isRectoVerso: isInImpressionGroup ? false : slotEffectiveIsRectoVerso,
        hasVarnish: isInImpressionGroup ? false : slot.hasVarnish,
        hasFlatColor: isInImpressionGroup ? false : slot.hasFlatColor,
        printSetupType: isInImpressionGroup ? 'none' : slot.printSetupType,
        cuttingSetupType: (isInImpressionGroup || isInDecoupeGroup) ? 'none' : slot.cuttingSetupType,
        hasImpression: isInImpressionGroup ? false : slot.hasImpression,
        hasFaconnage: false, hasConditionnement: false, hasAccessoires: false,
        cuttingTimePerPoseSeconds: (isInImpressionGroup || isInDecoupeGroup) ? 0 : slot.cuttingTimePerPoseSeconds,
        assemblyTimePerPieceSeconds: 0, packTimePerPieceSeconds: 0, hasAssemblyNotice: false,
        selectedAccessories: [], selectedConsumables: [], settings,
        hasPackaging: false, packagingPlate: undefined, packagingQuantity: 0,
        packagingCuttingTimePerPoseSeconds: 20, packagingWidth: 0, packagingHeight: 0,
        hasDossierFee: false,
      })

      return {
        slot,
        impositionResult: slotImposition,
        costResult: {
          materialCost: slotCosts.materialCostRaw,
          materialCostMarged: slotCosts.materialCostMarged,
          materialMarginCoeff: slotCosts.materialMarginCoeff,
          printingCost: slotCosts.printingCost,
          printingCostData: slotCosts.printingCostData,
          cuttingCost: slotCosts.cuttingCost,
          cuttingMachineCost: slotCosts.cuttingMachineCost,
          cuttingSetupCost: slotCosts.cuttingSetupCost,
          cuttingMachineTimeMin: slotCosts.cuttingMachineTimeMin,
          cuttingSetupTimeMin: slotCosts.cuttingSetupTimeMin,
          inkVolumeL: slotCosts.inkVolumeL,
          subtotal: slotCosts.totalCost,
        },
      }
    })

    return { amalgameGroupResults, productSlotResults }
  }, [isMultiProduct, amalgameGroups, products, plates, settings, poseSpacingMm, plateBorderMm])
}
