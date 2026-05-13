/**
 * Round-trip fidelity test
 *
 * Simulates the full cycle:
 *   1. Build a "full-features" quote in the calculator
 *   2. Serialize it to the DB payload (createQuote)
 *   3. Deserialize it back via the loadQuote mapping (useCalculator)
 *   4. Recalculate
 *   5. Assert that every feature flag and the total cost are preserved
 */

import { describe, it, expect } from 'vitest'
import { calculateCosts } from '@/lib/calculation/costs'
import { calculateImposition } from '@/lib/calculation/imposition'
import { TRANSPORT_MARGIN, POSE_SPACING_MM } from '@/lib/config/pricing'
import type { ImpositionResult } from '@/types/calculator'

// ── Helpers (mirror of useCalculator logic) ──────────────────────────────────

/** Builds a full ImpositionResult (with platesNeeded + materialCost) from raw calculateImposition */
function buildImposition(
  flatW: number, flatH: number,
  plate: { width: number; height: number; cost: number },
  quantity: number,
  spacing: number = POSE_SPACING_MM,
): ImpositionResult {
  const raw = calculateImposition({ width: flatW, height: flatH }, { width: plate.width, height: plate.height }, spacing)
  const platesNeeded = Math.ceil(quantity / raw.itemsPerPlate) || 0
  return {
    itemsPerPlate: raw.itemsPerPlate,
    platesNeeded,
    materialCost: platesNeeded * plate.cost,
    orientation: raw.orientation,
    layout: raw.layout,
  }
}

/** Mirrors resolveVerso() from useCalculator */
function resolveVerso(
  isRectoVerso: boolean, rectoVersoType: string | null,
  inkMlPerPlate: number, inkMlVerso: number,
) {
  const isDifferent = isRectoVerso && rectoVersoType === 'different' && inkMlVerso > 0
  return {
    effectiveInkMl: isDifferent ? inkMlPerPlate + inkMlVerso : inkMlPerPlate,
    effectiveIsRectoVerso: isRectoVerso && (rectoVersoType !== 'different' || inkMlVerso === 0),
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const mainPlate = {
  id: 1,
  name: 'Carton compact 1000×700',
  width: 1000,
  height: 700,
  cost: 12, // €/plaque — tier 3 margin applies
  material: 'Carton',
}

const packagingPlate = {
  id: 2,
  name: 'Kraft 800×600',
  width: 800,
  height: 600,
  cost: 4, // tier 1
  material: 'Kraft',
}

const accessories = [
  { id: 10, name: 'Clip métal', price: 0.5, quantity: 2 },
  { id: 11, name: 'Adhésif double-face', price: 0.3, quantity: 1 },
]

const consumables = [
  { id: 20, name: 'Colle néoprène', price: 8, size: 1000, sizePerItem: 5, quantity: 100 },
]

// ── Step 1 — Build "original" params ────────────────────────────────────────

const FLAT_W = 300
const FLAT_H = 200
const QUANTITY = 500

// plateCostOverride: negotiated price lower than catalog
const NEGOTIATED_PLATE_COST = 9.5
const virtualPlate = { ...mainPlate, cost: NEGOTIATED_PLATE_COST }

const impositionResult = buildImposition(FLAT_W, FLAT_H, virtualPlate, QUANTITY)

// R/V "different": verso has a different ink volume → resolveVerso combines them
const INK_ML_RECTO = 25
const INK_ML_VERSO = 15
const RECTYPE = 'different'
const { effectiveInkMl, effectiveIsRectoVerso } = resolveVerso(true, RECTYPE, INK_ML_RECTO, INK_ML_VERSO)

const TRANSPORT_TOTAL_HT = 120 // raw GEODIS cost

const originalParams: Parameters<typeof calculateCosts>[0] = {
  quantity: QUANTITY,
  impositionResult,
  selectedPlate: virtualPlate, // plate with negotiated cost
  inkMlPerPlate: effectiveInkMl,  // 25+15 = 40 (combined recto+verso)
  varnishSurfacePercent: 60,
  flatColorSurfacePercent: 0,
  printMode: 'quality',
  isRectoVerso: effectiveIsRectoVerso, // false when rectoVersoType=different
  hasVarnish: true,
  hasFlatColor: false,
  printSetupType: 'complexe',
  cuttingSetupType: 'standard',
  hasImpression: true,
  hasFaconnage: true,
  hasConditionnement: true,
  hasAccessoires: true,
  cuttingTimePerPoseSeconds: 30,
  assemblyTimePerPieceSeconds: 45,
  packTimePerPieceSeconds: 20,
  hasAssemblyNotice: true,
  hasPoseEtiquette: false,
  selectedAccessories: accessories,
  selectedConsumables: consumables,
  hasPackaging: true,
  packagingPlate,
  packagingQuantity: 50,
  packagingWidth: 350,
  packagingHeight: 250,
  packagingCuttingTimePerPoseSeconds: 20,
  hasBE: true,
  beTimeMinutes: 45,
  batTimeMinutes: 30,
  hasDossierFee: true,
  transportTotal: TRANSPORT_TOTAL_HT,
}

// ── Step 2 — Calculate original result ──────────────────────────────────────

const originalResult = calculateCosts(originalParams)

// ── Step 3 — Serialize (what createQuote/buildQuoteData sends to Prisma) ────
//
// We only need the scalar fields that go into the Quote row.
// transportDeliveries are stored separately; we reconstruct transportTotal on load.

const savedQuoteRow = {
  // identity
  plateId: mainPlate.id,
  flatWidth: FLAT_W,
  flatHeight: FLAT_H,
  quantity: QUANTITY,
  plateCostOverride: NEGOTIATED_PLATE_COST,
  // impression
  inkMlPerPlate: 25,
  inkMlVerso: 15, // verso ink (different R/V)
  varnishSurfacePercent: 60,
  flatColorSurfacePercent: 0,
  printMode: 'quality' as const,
  isRectoVerso: true,
  rectoVersoType: 'different' as const,
  hasVarnish: true,
  hasFlatColor: false,
  printSetupType: 'complexe' as const,
  hasImpression: true,
  // découpe
  cuttingSetupType: 'standard' as const,
  cuttingTimePerPoseSeconds: 30,
  // façonnage
  hasFaconnage: true,
  assemblyTimePerPieceSeconds: 45,
  // conditionnement
  hasConditionnement: true,
  packTimePerPieceSeconds: 20,
  hasAssemblyNotice: true,
  hasPoseEtiquette: false,
  // accessoires
  hasAccessoires: true,
  // emballage
  hasPackaging: true,
  packagingPlateId: packagingPlate.id,
  packagingQuantity: 50,
  packagingWidth: 350,
  packagingHeight: 250,
  packagingCuttingTimePerPoseSeconds: 20,
  // BE
  hasBE: true,
  beTimeMinutes: 45,
  batTimeMinutes: 30,
  // frais de dossier
  hasDossierFee: true,
  // flags
  isMultiProduct: false,
  showMargeCommerciale: false,
  showMargeSopano: false,
  // transport stored as deliveries — totalHT preserved
  transportDeliveries: [
    {
      transportMode: 'MESSAGERIE_PLUS',
      department: '75',
      weightKg: 15,
      units: 2,
      optionsHT: 10,
      basePriceHT: 110,
      totalHT: TRANSPORT_TOTAL_HT,
    },
  ],
}

// ── Step 4 — Deserialize (mirroring loadQuote in useCalculator.ts) ───────────

function simulateLoadQuote(row: typeof savedQuoteRow) {
  return {
    plateCostOverride: row.plateCostOverride ?? null,
    inkMlPerPlate: row.inkMlPerPlate ?? 20,
    inkMlVerso: row.inkMlVerso ?? 0,
    varnishSurfacePercent: row.varnishSurfacePercent ?? 0,
    flatColorSurfacePercent: row.flatColorSurfacePercent ?? 0,
    printMode: row.printMode ?? 'production',
    isRectoVerso: row.isRectoVerso || false,
    rectoVersoType: row.rectoVersoType ?? null,
    hasVarnish: row.hasVarnish || false,
    hasFlatColor: row.hasFlatColor || false,
    printSetupType: row.printSetupType ?? 'none',
    cuttingSetupType: row.cuttingSetupType ?? 'none',
    hasImpression: row.hasImpression ?? true,
    cuttingTimePerPoseSeconds: row.cuttingTimePerPoseSeconds || 0,
    hasFaconnage: row.hasFaconnage ?? true,
    assemblyTimePerPieceSeconds: row.assemblyTimePerPieceSeconds || 0,
    hasConditionnement: row.hasConditionnement ?? true,
    packTimePerPieceSeconds: row.packTimePerPieceSeconds || 0,
    hasAssemblyNotice: row.hasAssemblyNotice || false,
    hasPoseEtiquette: row.hasPoseEtiquette || false,
    hasAccessoires: row.hasAccessoires ?? false,
    hasPackaging: row.hasPackaging || false,
    packagingCuttingTimePerPoseSeconds: row.packagingCuttingTimePerPoseSeconds || 20,
    packagingQuantity: row.packagingQuantity || 0,
    packagingWidth: row.packagingWidth || 0,
    packagingHeight: row.packagingHeight || 0,
    hasBE: row.hasBE ?? false,
    beTimeMinutes: row.beTimeMinutes ?? 0,
    batTimeMinutes: row.batTimeMinutes ?? 0,
    hasDossierFee: row.hasDossierFee ?? false,
    isMultiProduct: row.isMultiProduct ?? false,
    showMargeCommerciale: row.showMargeCommerciale ?? false,
    showMargeSopano: row.showMargeSopano ?? false,
    // transport: sum of delivery totalHT
    transportTotal: row.transportDeliveries.reduce((s, d) => s + d.totalHT, 0),
  }
}

const loaded = simulateLoadQuote(savedQuoteRow)

// Rebuild virtual plate from loaded override (mirrors useCalculator selectedPlate logic)
const loadedPlate =
  loaded.plateCostOverride !== null && loaded.plateCostOverride > 0
    ? { ...mainPlate, cost: loaded.plateCostOverride }
    : mainPlate

// Accessories/consumables are stored in join tables and restored with full objects
const loadedAccessories = accessories // same objects reloaded from DB
const loadedConsumables = consumables

// Recompute imposition with full result (mirrors useCalculator's setImpositionResult)
const loadedImposition = buildImposition(FLAT_W, FLAT_H, loadedPlate, QUANTITY)

// Apply resolveVerso for R/V different (mirrors useCalculator)
const { effectiveInkMl: loadedInkMl, effectiveIsRectoVerso: loadedIsRV } = resolveVerso(
  loaded.isRectoVerso,
  loaded.rectoVersoType,
  loaded.inkMlPerPlate,
  loaded.inkMlVerso,
)

const loadedParams: Parameters<typeof calculateCosts>[0] = {
  quantity: QUANTITY,
  impositionResult: loadedImposition,
  selectedPlate: loadedPlate,
  inkMlPerPlate: loadedInkMl,
  varnishSurfacePercent: loaded.varnishSurfacePercent,
  flatColorSurfacePercent: loaded.flatColorSurfacePercent,
  printMode: loaded.printMode as 'production' | 'quality',
  isRectoVerso: loadedIsRV,
  hasVarnish: loaded.hasVarnish,
  hasFlatColor: loaded.hasFlatColor,
  printSetupType: loaded.printSetupType as 'none' | 'standard' | 'complexe',
  cuttingSetupType: loaded.cuttingSetupType as 'none' | 'standard' | 'complexe',
  hasImpression: loaded.hasImpression,
  cuttingTimePerPoseSeconds: loaded.cuttingTimePerPoseSeconds,
  hasFaconnage: loaded.hasFaconnage,
  assemblyTimePerPieceSeconds: loaded.assemblyTimePerPieceSeconds,
  hasConditionnement: loaded.hasConditionnement,
  packTimePerPieceSeconds: loaded.packTimePerPieceSeconds,
  hasAssemblyNotice: loaded.hasAssemblyNotice,
  hasPoseEtiquette: loaded.hasPoseEtiquette || false,
  hasAccessoires: loaded.hasAccessoires,
  selectedAccessories: loadedAccessories,
  selectedConsumables: loadedConsumables,
  hasPackaging: loaded.hasPackaging,
  packagingPlate,
  packagingQuantity: loaded.packagingQuantity,
  packagingWidth: loaded.packagingWidth,
  packagingHeight: loaded.packagingHeight,
  packagingCuttingTimePerPoseSeconds: loaded.packagingCuttingTimePerPoseSeconds,
  hasBE: loaded.hasBE,
  beTimeMinutes: loaded.beTimeMinutes,
  batTimeMinutes: loaded.batTimeMinutes,
  hasDossierFee: loaded.hasDossierFee,
  transportTotal: loaded.transportTotal,
}

// ── Step 5 — Recalculate ─────────────────────────────────────────────────────

const reloadedResult = calculateCosts(loadedParams)

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Quote round-trip fidelity', () => {
  it('imposition is identical after reload', () => {
    expect(loadedImposition.itemsPerPlate).toBe(impositionResult.itemsPerPlate)
    expect(loadedImposition.platesNeeded).toBe(impositionResult.platesNeeded)
    // materialCost differs between original (negotiated plate cost) and catalog — tested separately
    expect(loadedImposition.materialCost).toBeCloseTo(impositionResult.materialCost, 6)
  })

  it('plateCostOverride is preserved and applied', () => {
    expect(loaded.plateCostOverride).toBe(NEGOTIATED_PLATE_COST)
    expect(loadedPlate.cost).toBe(NEGOTIATED_PLATE_COST)
    // Negotiated cost is lower than catalog (12 vs 9.5) → material cost should differ
    const catalogImposition = buildImposition(FLAT_W, FLAT_H, mainPlate, QUANTITY)
    const resultWithCatalog = calculateCosts({ ...originalParams, selectedPlate: mainPlate, impositionResult: catalogImposition })
    expect(reloadedResult.materialCostMarged).not.toBeCloseTo(resultWithCatalog.materialCostMarged, 2)
  })

  it('all feature flags are preserved', () => {
    expect(loaded.hasImpression).toBe(true)
    expect(loaded.isRectoVerso).toBe(true)
    expect(loaded.rectoVersoType).toBe('different')
    expect(loaded.hasVarnish).toBe(true)
    expect(loaded.hasFlatColor).toBe(false)
    expect(loaded.printSetupType).toBe('complexe')
    expect(loaded.printMode).toBe('quality')
    expect(loaded.cuttingSetupType).toBe('standard')
    expect(loaded.cuttingTimePerPoseSeconds).toBe(30)
    expect(loaded.hasFaconnage).toBe(true)
    expect(loaded.assemblyTimePerPieceSeconds).toBe(45)
    expect(loaded.hasConditionnement).toBe(true)
    expect(loaded.packTimePerPieceSeconds).toBe(20)
    expect(loaded.hasAssemblyNotice).toBe(true)
    expect(loaded.hasAccessoires).toBe(true)
    expect(loaded.hasPackaging).toBe(true)
    expect(loaded.packagingQuantity).toBe(50)
    expect(loaded.packagingWidth).toBe(350)
    expect(loaded.packagingHeight).toBe(250)
    expect(loaded.packagingCuttingTimePerPoseSeconds).toBe(20)
    expect(loaded.hasBE).toBe(true)
    expect(loaded.beTimeMinutes).toBe(45)
    expect(loaded.batTimeMinutes).toBe(30)
    expect(loaded.hasDossierFee).toBe(true)
    expect(loaded.isMultiProduct).toBe(false)
  })

  it('transport total is reconstructed from deliveries', () => {
    expect(loaded.transportTotal).toBe(TRANSPORT_TOTAL_HT)
  })

  it('transport margin is applied identically', () => {
    expect(reloadedResult.transportCostMarged).toBeCloseTo(
      TRANSPORT_TOTAL_HT * TRANSPORT_MARGIN,
      6
    )
    expect(reloadedResult.transportMargin).toBe(TRANSPORT_MARGIN)
  })

  it('each cost component is identical after reload', () => {
    expect(reloadedResult.materialCostMarged).toBeCloseTo(originalResult.materialCostMarged, 6)
    expect(reloadedResult.printingCost).toBeCloseTo(originalResult.printingCost, 6)
    expect(reloadedResult.cuttingCost).toBeCloseTo(originalResult.cuttingCost, 6)
    expect(reloadedResult.assemblyCost).toBeCloseTo(originalResult.assemblyCost, 6)
    expect(reloadedResult.packagingCost).toBeCloseTo(originalResult.packagingCost, 6)
    expect(reloadedResult.accessoriesCost).toBeCloseTo(originalResult.accessoriesCost, 6)
    expect(reloadedResult.consumablesCost).toBeCloseTo(originalResult.consumablesCost, 6)
    expect(reloadedResult.packagingTotalCost).toBeCloseTo(originalResult.packagingTotalCost, 6)
    expect(reloadedResult.beTotalCost).toBeCloseTo(originalResult.beTotalCost, 6)
    expect(reloadedResult.dossierFeeCost).toBeCloseTo(originalResult.dossierFeeCost, 6)
    expect(reloadedResult.transportCostMarged).toBeCloseTo(originalResult.transportCostMarged, 6)
  })

  it('total cost is identical after save → load → recalculate', () => {
    expect(reloadedResult.totalCost).toBeCloseTo(originalResult.totalCost, 6)
    // Sanity: total must be positive and non-trivial
    expect(reloadedResult.totalCost).toBeGreaterThan(0)
  })

  it('all individual costs contribute to total (no silent zero-out)', () => {
    // Ensure none of the sections silently returned 0
    expect(originalResult.printingCost).toBeGreaterThan(0)
    expect(originalResult.cuttingCost).toBeGreaterThan(0)
    expect(originalResult.assemblyCost).toBeGreaterThan(0)
    expect(originalResult.packagingCost).toBeGreaterThan(0)
    expect(originalResult.accessoriesCost).toBeGreaterThan(0)
    expect(originalResult.consumablesCost).toBeGreaterThan(0)
    expect(originalResult.packagingTotalCost).toBeGreaterThan(0)
    expect(originalResult.beTotalCost).toBeGreaterThan(0)
    expect(originalResult.dossierFeeCost).toBeGreaterThan(0)
    expect(originalResult.transportCostMarged).toBeGreaterThan(0)
    expect(originalResult.materialCostMarged).toBeGreaterThan(0)
  })
})
