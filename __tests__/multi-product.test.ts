import { describe, it, expect } from 'vitest'
import { calculateCosts } from '@/lib/calculation/costs'
import { calculateImposition } from '@/lib/calculation/imposition'
import { POSE_SPACING_MM } from '@/lib/config/pricing'

// ── Simule ce que le hook fait pour chaque slot en mode multi-produit ──
function computeSlot(params: {
  flatWidth: number
  flatHeight: number
  quantity: number
  plate: { id: number; name: string; width: number; height: number; cost: number; material: string }
  inkMlPerPlate?: number
  cuttingTimePerPoseSeconds?: number
  isRectoVerso?: boolean
  hasImpression?: boolean
  hasVarnish?: boolean
}) {
  const { flatWidth, flatHeight, quantity, plate } = params
  const imp = calculateImposition(
    { width: flatWidth, height: flatHeight },
    { width: plate.width, height: plate.height },
    POSE_SPACING_MM
  )
  const platesNeeded = Math.ceil(quantity / imp.itemsPerPlate) || 0
  const impositionResult = {
    itemsPerPlate: imp.itemsPerPlate,
    platesNeeded,
    materialCost: platesNeeded * plate.cost,
    orientation: imp.orientation,
    layout: imp.layout,
  }

  const costs = calculateCosts({
    quantity,
    impositionResult,
    selectedPlate: plate,
    inkMlPerPlate: params.inkMlPerPlate ?? 0,
    varnishSurfacePercent: 0,
    flatColorSurfacePercent: 0,
    printMode: 'production',
    isRectoVerso: params.isRectoVerso ?? false,
    hasVarnish: params.hasVarnish ?? false,
    hasFlatColor: false,
    printSetupType: 'none',
    cuttingSetupType: 'none',
    hasImpression: params.hasImpression ?? true,
    hasFaconnage: false,
    hasConditionnement: false,
    hasAccessoires: false,
    cuttingTimePerPoseSeconds: params.cuttingTimePerPoseSeconds ?? 0,
    assemblyTimePerPieceSeconds: 0,
    packTimePerPieceSeconds: 0,
    hasAssemblyNotice: false,
    hasPoseEtiquette: false,
    selectedAccessories: [],
    selectedConsumables: [],
    hasPackaging: false,
    packagingPlate: undefined,
    packagingQuantity: 0,
    packagingCuttingTimePerPoseSeconds: 20,
    packagingWidth: 0,
    packagingHeight: 0,
    hasDossierFee: false,
  })

  return { impositionResult, costs }
}

const plateA = { id: 1, name: 'Plaque A', width: 1000, height: 700, cost: 8, material: 'Microbis' }
const plateB = { id: 2, name: 'Plaque B', width: 800, height: 600, cost: 6, material: 'Simili' }

describe('multi-produit — imposition par slot', () => {
  it('calcule des impositions indépendantes par produit', () => {
    const slot1 = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA })
    const slot2 = computeSlot({ flatWidth: 200, flatHeight: 200, quantity: 200, plate: plateB })

    // Chaque slot a son propre résultat d'imposition
    expect(slot1.impositionResult.itemsPerPlate).toBeGreaterThan(0)
    expect(slot2.impositionResult.itemsPerPlate).toBeGreaterThan(0)
    // Les résultats sont différents (produits différents)
    expect(slot1.impositionResult.itemsPerPlate).not.toBe(slot2.impositionResult.itemsPerPlate)
  })

  it('le nombre de plaques est ceil(quantité / posesParPlaque)', () => {
    const slot = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA })
    expect(slot.impositionResult.platesNeeded).toBe(
      Math.ceil(500 / slot.impositionResult.itemsPerPlate)
    )
  })
})

describe('multi-produit — coûts par slot', () => {
  it('chaque slot a un sous-total indépendant', () => {
    const slot1 = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA, inkMlPerPlate: 20 })
    const slot2 = computeSlot({ flatWidth: 200, flatHeight: 200, quantity: 200, plate: plateB, inkMlPerPlate: 30 })

    expect(slot1.costs.totalCost).toBeGreaterThan(0)
    expect(slot2.costs.totalCost).toBeGreaterThan(0)
    expect(slot1.costs.totalCost).not.toBe(slot2.costs.totalCost)
  })

  it('la somme des sous-totaux représente le total multi-produit', () => {
    const slot1 = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA, inkMlPerPlate: 20 })
    const slot2 = computeSlot({ flatWidth: 200, flatHeight: 200, quantity: 200, plate: plateB, inkMlPerPlate: 30 })
    const slot3 = computeSlot({ flatWidth: 50,  flatHeight: 80,  quantity: 1000, plate: plateA, inkMlPerPlate: 10 })

    const totalMulti = slot1.costs.totalCost + slot2.costs.totalCost + slot3.costs.totalCost
    expect(totalMulti).toBeGreaterThan(slot1.costs.totalCost)
    expect(totalMulti).toBeGreaterThan(slot2.costs.totalCost)
    expect(totalMulti).toBeGreaterThan(slot3.costs.totalCost)
  })

  it('un slot sans impression a printingCost = 0', () => {
    const slot = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 200, plate: plateA, hasImpression: false, inkMlPerPlate: 0 })
    expect(slot.costs.printingCost).toBe(0)
  })

  it('un slot recto-verso double le coût encre', () => {
    const recto = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 200, plate: plateA, inkMlPerPlate: 20, isRectoVerso: false })
    const rectoVerso = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 200, plate: plateA, inkMlPerPlate: 20, isRectoVerso: true })
    expect(rectoVerso.costs.printingCostData.inkCost).toBeCloseTo(recto.costs.printingCostData.inkCost * 2, 2)
  })
})

describe('multi-produit — comportement avec des quantités variées', () => {
  it('un slot avec plus de quantité a généralement un coût plus élevé', () => {
    const petit = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 100, plate: plateA, inkMlPerPlate: 20, cuttingTimePerPoseSeconds: 20 })
    const grand = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 1000, plate: plateA, inkMlPerPlate: 20, cuttingTimePerPoseSeconds: 20 })
    expect(grand.costs.totalCost).toBeGreaterThan(petit.costs.totalCost)
  })

  it('un slot avec quantité = 0 retourne totalCost = 0', () => {
    // Imposition retourne 0 itemsPerPlate si quantité = 0 → platesNeeded = 0
    const slot = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 0, plate: plateA })
    expect(slot.costs.totalCost).toBe(0)
  })
})

describe('multi-produit — matière coefficientée par slot', () => {
  it('chaque slot applique son propre coefficient matière', () => {
    // plateA cost=8 → tier2 (5-10€) → coeff 3
    // plateB cost=6 → tier2 aussi → coeff 3
    const slot1 = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA })
    const slot2 = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateB })

    expect(slot1.costs.materialMarginCoeff).toBe(slot2.costs.materialMarginCoeff) // même tier
    expect(slot1.costs.materialCostMarged).not.toBe(slot2.costs.materialCostMarged) // coûts différents (plaques différentes)
  })

  it('materialCostMarged = materialCostRaw × materialMarginCoeff pour chaque slot', () => {
    const slot = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA })
    expect(slot.costs.materialCostMarged).toBeCloseTo(
      slot.costs.materialCostRaw * slot.costs.materialMarginCoeff, 2
    )
  })
})

describe('multi-produit — cohérence avec le mode mono-produit', () => {
  it('un seul slot en multi = même résultat qu\'en mono pour les mêmes params', () => {
    const imp = calculateImposition(
      { width: 100, height: 150 },
      { width: plateA.width, height: plateA.height },
      POSE_SPACING_MM
    )
    const platesNeeded = Math.ceil(500 / imp.itemsPerPlate)
    const impositionResult = {
      itemsPerPlate: imp.itemsPerPlate,
      platesNeeded,
      materialCost: platesNeeded * plateA.cost,
      orientation: imp.orientation,
      layout: imp.layout,
    }

    const mono = calculateCosts({
      quantity: 500,
      impositionResult,
      selectedPlate: plateA,
      inkMlPerPlate: 20,
      varnishSurfacePercent: 0,
      flatColorSurfacePercent: 0,
      printMode: 'production',
      isRectoVerso: false,
      hasVarnish: false,
      hasFlatColor: false,
      printSetupType: 'none',
      cuttingSetupType: 'none',
      hasImpression: true,
      hasFaconnage: false,
      hasConditionnement: false,
      hasAccessoires: false,
      cuttingTimePerPoseSeconds: 20,
      assemblyTimePerPieceSeconds: 0,
      packTimePerPieceSeconds: 0,
      hasAssemblyNotice: false,
      hasPoseEtiquette: false,
      selectedAccessories: [],
      selectedConsumables: [],
      hasPackaging: false,
      packagingPlate: undefined,
      packagingQuantity: 0,
      packagingCuttingTimePerPoseSeconds: 20,
      packagingWidth: 0,
      packagingHeight: 0,
      hasDossierFee: false,
    })

    const multi = computeSlot({ flatWidth: 100, flatHeight: 150, quantity: 500, plate: plateA, inkMlPerPlate: 20, cuttingTimePerPoseSeconds: 20 })

    expect(multi.costs.totalCost).toBeCloseTo(mono.totalCost, 2)
    expect(multi.costs.materialCostMarged).toBeCloseTo(mono.materialCostMarged, 2)
    expect(multi.costs.printingCost).toBeCloseTo(mono.printingCost, 2)
  })
})
