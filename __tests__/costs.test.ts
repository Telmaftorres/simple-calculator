import { describe, it, expect } from 'vitest'
import { calculateCosts } from '@/lib/calculation/costs'
import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_CUTTING,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_CONDITIONING,
  HOURLY_RATE_BE,
  HOURLY_RATE_BAT,
  HOURLY_RATE_PACKAGING,
  INK_COST_PER_LITER,
  INK_COST_VARNISH_PER_LITER,
  INK_COST_FLAT_COLOR_PER_LITER,
  INK_MARGIN_STANDARD,
  INK_MARGIN_VARNISH,
  INK_MARGIN_FLAT_COLOR,
  PRINT_SETUP_STANDARD_COST,
  CUTTING_SETUP_STANDARD_COST,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
  DOSSIER_FEE,
  MATERIAL_MARGIN_TIER1,
  MATERIAL_MARGIN_TIER2,
  MATERIAL_MARGIN_TIER3,
  MATERIAL_MARGIN_TIER4,
  PACKAGING_SETUP_COST,
} from '@/lib/config/pricing'

const mockPlate = {
  id: 1,
  name: 'Test Plate',
  width: 1000,
  height: 1000,
  cost: 10,
  material: 'Test',
}

const mockImpositionResult = {
  itemsPerPlate: 10,
  platesNeeded: 5,
  materialCost: 50,
  orientation: 'normal' as const,
  layout: [],
}

const defaultParams = {
  quantity: 100,
  impositionResult: mockImpositionResult,
  selectedPlate: mockPlate,
  inkMlPerPlate: 20,
  varnishSurfacePercent: 0,
  flatColorSurfacePercent: 0,
  printMode: 'production' as const,
  isRectoVerso: false,
  hasVarnish: false,
  hasFlatColor: false,
  cuttingTimePerPoseSeconds: 20,
  assemblyTimePerPieceSeconds: 0,
  packTimePerPieceSeconds: 0,
  hasAssemblyNotice: false,
  selectedAccessories: [],
  selectedConsumables: [],
  printSetupType: 'standard' as const,
  cuttingSetupType: 'standard' as const,
  hasImpression: true,
  hasFaconnage: true,
  hasConditionnement: true,
  hasAccessoires: false,
  hasPackaging: false,
  packagingPlate: undefined,
  packagingQuantity: 0,
  packagingCuttingTimePerPoseSeconds: 20,
  packagingWidth: 0,
  packagingHeight: 0,
  settings: undefined,
}

describe('calculateCosts', () => {
  describe('totalCost', () => {
    it('retourne 0 si pas de résultat d\'imposition', () => {
      const result = calculateCosts({ ...defaultParams, impositionResult: null })
      expect(result.totalCost).toBe(0)
      expect(result.printingCost).toBe(0)
    })

    it('inclut le coût matière dans le total', () => {
      const result = calculateCosts(defaultParams)
      expect(result.totalCost).toBeGreaterThanOrEqual(mockImpositionResult.materialCost)
    })

    it('totalCost = matière (margée) + impression + découpe + façonnage + conditionnement + accessoires + consommables', () => {
      const result = calculateCosts(defaultParams)
      const expected =
        result.materialCostMarged +
        result.printingCost +
        result.cuttingCost +
        result.assemblyCost +
        result.packagingCost +
        result.accessoriesCost +
        result.consumablesCost
      expect(result.totalCost).toBeCloseTo(expected, 2)
    })
  })

  describe('cuttingCost', () => {
    it('calcule correctement le coût de découpe', () => {
      const result = calculateCosts(defaultParams)
      const machineTimeMin = (20 * 100) / 60
      const machineCost = (machineTimeMin / 60) * HOURLY_RATE_CUTTING
      const expected = machineCost + CUTTING_SETUP_STANDARD_COST
      expect(result.cuttingCost).toBeCloseTo(expected, 2)
    })

    it('retourne 0 si pas de résultat d\'imposition', () => {
      const result = calculateCosts({ ...defaultParams, impositionResult: null })
      expect(result.cuttingCost).toBe(0)
    })
  })

  describe('assemblyCost', () => {
    it('retourne 0 si temps façonnage = 0', () => {
      const result = calculateCosts({ ...defaultParams, assemblyTimePerPieceSeconds: 0 })
      expect(result.assemblyCost).toBe(0)
    })

    it('calcule correctement le coût de façonnage', () => {
      const result = calculateCosts({ ...defaultParams, hasFaconnage: true, assemblyTimePerPieceSeconds: 60 })
      const expected = (60 * 100 / 3600) * HOURLY_RATE_ASSEMBLY
      expect(result.assemblyCost).toBeCloseTo(expected, 2)
    })
  })

  describe('packagingCost', () => {
    it('retourne 0 si temps conditionnement = 0 et pas de notice', () => {
      const result = calculateCosts(defaultParams)
      expect(result.packagingCost).toBe(0)
    })

    it('ajoute le coût de notice si hasAssemblyNotice = true', () => {
      const result = calculateCosts({ ...defaultParams, hasAssemblyNotice: true })
      const expected = ASSEMBLY_NOTICE_COST_PER_PIECE * 100
      expect(result.packagingCost).toBeCloseTo(expected, 2)
    })

    it('calcule correctement conditionnement + notice', () => {
      const result = calculateCosts({
        ...defaultParams,
        packTimePerPieceSeconds: 30,
        hasAssemblyNotice: true,
      })
      const timeCost = (30 * 100 / 3600) * HOURLY_RATE_CONDITIONING
      const noticeCost = ASSEMBLY_NOTICE_COST_PER_PIECE * 100
      expect(result.packagingCost).toBeCloseTo(timeCost + noticeCost, 2)
    })
  })

  describe('printingCostData', () => {
    it('retourne coûts à 0 si inkMlPerPlate = 0', () => {
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 0, printSetupType: 'none' })
      expect(result.printingCostData.inkCost).toBe(0)
      expect(result.printingCostData.setupCost).toBe(0)
    })

    it('double le coût encre si recto/verso', () => {
      const recto = calculateCosts({ ...defaultParams, isRectoVerso: false })
      const rectoVerso = calculateCosts({ ...defaultParams, isRectoVerso: true })
      expect(rectoVerso.printingCostData.inkCost).toBeCloseTo(
        recto.printingCostData.inkCost * 2, 2
      )
    })

    it('calcule encre standard seule sans finition', () => {
      // 20 ml × 5 plaques = 100 ml = 0.1 L × 95 €/L × marge 4.5
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 20 })
      const expectedInkCost = (20 * 5 / 1000) * INK_COST_PER_LITER * INK_MARGIN_STANDARD
      expect(result.printingCostData.inkCost).toBeCloseTo(expectedInkCost, 2)
    })

    it('vernis ajoute une couche supplémentaire d\'encre vers INK_COST_VARNISH_PER_LITER', () => {
      // Avec vernis 30% : standard 100% × 95€/L + vernis 30% × INK_COST_VARNISH_PER_LITER
      const sans = calculateCosts({ ...defaultParams, inkMlPerPlate: 20, hasVarnish: false })
      const avec = calculateCosts({
        ...defaultParams,
        inkMlPerPlate: 20,
        hasVarnish: true,
        varnishSurfacePercent: 30,
      })
      const standardVolumeL = (20 * 1 * 5) / 1000
      const varnishVolumeL = (20 * 0.30 * 5) / 1000
      const expected = standardVolumeL * INK_COST_PER_LITER * INK_MARGIN_STANDARD + varnishVolumeL * INK_COST_VARNISH_PER_LITER * INK_MARGIN_VARNISH
      expect(avec.printingCostData.inkCost).toBeCloseTo(expected, 2)
      expect(avec.printingCostData.inkCost).toBeGreaterThan(sans.printingCostData.inkCost)
    })

    it('blanc ajoute une couche d\'encre vers INK_COST_FLAT_COLOR_PER_LITER', () => {
      const sans = calculateCosts({ ...defaultParams, inkMlPerPlate: 20, hasFlatColor: false })
      const avec = calculateCosts({
        ...defaultParams,
        inkMlPerPlate: 20,
        hasFlatColor: true,
        flatColorSurfacePercent: 25,
      })
      const standardVolumeL = (20 * 1 * 5) / 1000
      const flatColorVolumeL = (20 * 0.25 * 5) / 1000
      const expected = standardVolumeL * INK_COST_PER_LITER * INK_MARGIN_STANDARD + flatColorVolumeL * INK_COST_FLAT_COLOR_PER_LITER * INK_MARGIN_FLAT_COLOR
      expect(avec.printingCostData.inkCost).toBeCloseTo(expected, 2)
      expect(avec.printingCostData.inkCost).toBeGreaterThan(sans.printingCostData.inkCost)
    })

    it('vernis et aplat peuvent avoir des coûts différents', () => {
      // Vérifie que les deux constantes sont bien utilisées séparément
      const avecVernis = calculateCosts({
        ...defaultParams,
        inkMlPerPlate: 20,
        hasVarnish: true, varnishSurfacePercent: 50,
        hasFlatColor: false,
      })
      const avecAplat = calculateCosts({
        ...defaultParams,
        inkMlPerPlate: 20,
        hasVarnish: false,
        hasFlatColor: true, flatColorSurfacePercent: 50,
      })
      const varnishVolumeL = (20 * 0.50 * 5) / 1000
      const flatColorVolumeL = (20 * 0.50 * 5) / 1000
      const expectedVernis = (20 * 1 * 5 / 1000) * INK_COST_PER_LITER * INK_MARGIN_STANDARD + varnishVolumeL * INK_COST_VARNISH_PER_LITER * INK_MARGIN_VARNISH
      const expectedAplat = (20 * 1 * 5 / 1000) * INK_COST_PER_LITER * INK_MARGIN_STANDARD + flatColorVolumeL * INK_COST_FLAT_COLOR_PER_LITER * INK_MARGIN_FLAT_COLOR
      expect(avecVernis.printingCostData.inkCost).toBeCloseTo(expectedVernis, 2)
      expect(avecAplat.printingCostData.inkCost).toBeCloseTo(expectedAplat, 2)
    })

    it('cumule vernis + blanc — base standard conservée avec ajout de volume', () => {
      // Vernis 30% + blanc 20% → base standard reste à 100%
      // Volume = encre standard + encre extra 
      const sans = calculateCosts({
        ...defaultParams,
        inkMlPerPlate: 20,
        hasVarnish: false,
        hasFlatColor: false,
      })
      const avec = calculateCosts({
        ...defaultParams,
        inkMlPerPlate: 20,
        hasVarnish: true, varnishSurfacePercent: 30,
        hasFlatColor: true, flatColorSurfacePercent: 20,
      })
      const standardVolumeL = (20 * 1 * 5) / 1000
      const varnishVolumeL = (20 * 0.30 * 5) / 1000
      const flatColorVolumeL = (20 * 0.20 * 5) / 1000
      const expected =
        standardVolumeL * INK_COST_PER_LITER * INK_MARGIN_STANDARD +
        varnishVolumeL * INK_COST_VARNISH_PER_LITER * INK_MARGIN_VARNISH +
        flatColorVolumeL * INK_COST_FLAT_COLOR_PER_LITER * INK_MARGIN_FLAT_COLOR
      expect(avec.printingCostData.inkCost).toBeCloseTo(expected, 2)
      // Volume est plus grand
      expect(avec.inkVolumeL).toBeGreaterThan(sans.inkVolumeL)
      // Coût plus élevé car finitions > encre standard
      expect(avec.printingCostData.inkCost).toBeGreaterThan(sans.printingCostData.inkCost)
    })

    it('ajoute le calage si inkMlPerPlate > 0', () => {
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 20 })
      expect(result.printingCostData.setupCost).toBeCloseTo(PRINT_SETUP_STANDARD_COST, 2)
    })

    it('pas de calage si printSetupType = none', () => {
      const result = calculateCosts({ ...defaultParams, printSetupType: 'none' })
      expect(result.printingCostData.setupCost).toBe(0)
    })
  })

  describe('accessoriesCost', () => {
    it('retourne 0 si pas d\'accessoires', () => {
      const result = calculateCosts({ ...defaultParams, selectedAccessories: [] })
      expect(result.accessoriesCost).toBe(0)
    })

    it('calcule correctement le coût des accessoires', () => {
      const accessories = [
        { id: 1, name: 'Grip', price: 2, quantity: 10 },
        { id: 2, name: 'Potence', price: 3, quantity: 5 },
      ]
      const result = calculateCosts({ ...defaultParams, hasAccessoires: true, selectedAccessories: accessories })
      expect(result.accessoriesCost).toBe(2 * 10 + 3 * 5)
    })
  })

  describe('consumablesCost', () => {
    it('retourne 0 si pas de consommables', () => {
      const result = calculateCosts({ ...defaultParams, selectedConsumables: [] })
      expect(result.consumablesCost).toBe(0)
    })

    it('calcule correctement le coût des consommables', () => {
      const consumables = [
        { id: 1, name: 'Scotch', price: 10, size: 50, sizePerItem: 0.5, quantity: 100 },
      ]
      const result = calculateCosts({ ...defaultParams, selectedConsumables: consumables })
      const expected = (0.5 * 100 / 50) * 10
      expect(result.consumablesCost).toBeCloseTo(expected, 2)
    })
  })

  describe('beCost / batCost', () => {
    it('retourne 0 si hasBE = false', () => {
      const result = calculateCosts({ ...defaultParams, hasBE: false, beTimeMinutes: 60, batTimeMinutes: 30 })
      expect(result.beCost).toBe(0)
      expect(result.batCost).toBe(0)
    })

    it('calcule correctement beCost', () => {
      const result = calculateCosts({ ...defaultParams, hasBE: true, beTimeMinutes: 60, batTimeMinutes: 0 })
      const expected = (60 / 60) * HOURLY_RATE_BE
      expect(result.beCost).toBeCloseTo(expected, 2)
    })

    it('calcule correctement batCost', () => {
      const result = calculateCosts({ ...defaultParams, hasBE: true, beTimeMinutes: 0, batTimeMinutes: 30 })
      const expected = (30 / 60) * HOURLY_RATE_BAT
      expect(result.batCost).toBeCloseTo(expected, 2)
    })

    it('beTotalCost = beCost + batCost', () => {
      const result = calculateCosts({ ...defaultParams, hasBE: true, beTimeMinutes: 60, batTimeMinutes: 30 })
      expect(result.beTotalCost).toBeCloseTo(result.beCost + result.batCost, 2)
    })
  })

  describe('dossierFeeCost', () => {
    it('retourne 0 si hasDossierFee = false', () => {
      const result = calculateCosts({ ...defaultParams, hasDossierFee: false })
      expect(result.dossierFeeCost).toBe(0)
    })

    it('retourne DOSSIER_FEE si hasDossierFee = true', () => {
      const result = calculateCosts({ ...defaultParams, hasDossierFee: true })
      expect(result.dossierFeeCost).toBe(DOSSIER_FEE)
    })

    it('inclut les frais de dossier dans le total', () => {
      const sans = calculateCosts({ ...defaultParams, hasDossierFee: false })
      const avec = calculateCosts({ ...defaultParams, hasDossierFee: true })
      expect(avec.totalCost).toBeCloseTo(sans.totalCost + DOSSIER_FEE, 2)
    })
  })

  describe('materialMarginCoeff', () => {
    it('applique MATERIAL_MARGIN_TIER1 si coût plaque < 5€', () => {
      const plate = { ...mockPlate, cost: 3 }
      const result = calculateCosts({ ...defaultParams, selectedPlate: plate })
      expect(result.materialMarginCoeff).toBe(MATERIAL_MARGIN_TIER1)
    })

    it('applique MATERIAL_MARGIN_TIER2 si coût plaque entre 5 et 10€', () => {
      const plate = { ...mockPlate, cost: 7 }
      const result = calculateCosts({ ...defaultParams, selectedPlate: plate })
      expect(result.materialMarginCoeff).toBe(MATERIAL_MARGIN_TIER2)
    })

    it('applique MATERIAL_MARGIN_TIER3 si coût plaque entre 10 et 20€', () => {
      const plate = { ...mockPlate, cost: 15 }
      const result = calculateCosts({ ...defaultParams, selectedPlate: plate })
      expect(result.materialMarginCoeff).toBe(MATERIAL_MARGIN_TIER3)
    })

    it('applique MATERIAL_MARGIN_TIER4 si coût plaque > 20€', () => {
      const plate = { ...mockPlate, cost: 25 }
      const result = calculateCosts({ ...defaultParams, selectedPlate: plate })
      expect(result.materialMarginCoeff).toBe(MATERIAL_MARGIN_TIER4)
    })

    it('materialCostMarged = materialCostRaw × materialMarginCoeff', () => {
      const result = calculateCosts({ ...defaultParams })
      expect(result.materialCostMarged).toBeCloseTo(result.materialCostRaw * result.materialMarginCoeff, 2)
    })
  })

  describe('emballage (packaging box)', () => {
    const packagingPlate = { id: 99, name: 'BC Test', width: 800, height: 600, cost: 5, material: 'BC' }

    it('retourne 0 si hasPackaging = false', () => {
      const result = calculateCosts({ ...defaultParams, hasPackaging: false })
      expect(result.packagingTotalCost).toBe(0)
      expect(result.packagingMaterialCost).toBe(0)
      expect(result.packagingCuttingCost).toBe(0)
    })

    it('retourne 0 si dimensions emballage non renseignées', () => {
      const result = calculateCosts({
        ...defaultParams,
        hasPackaging: true,
        packagingPlate,
        packagingQuantity: 100,
        packagingWidth: 0,
        packagingHeight: 0,
      })
      expect(result.packagingMaterialCost).toBe(0)
    })

    it('calcule le coût matière emballage', () => {
      // Plaque 800×600, carton 200×150, spacing 10mm
      // L'imposition avec espacement retourne 13 items/plaque (orientation mixte)
      // 100 cartons → ceil(100/13) = 8 plaques × 5€ × MATERIAL_MARGIN_TIER2(coût 5€ → tier2=3) = 120€
      const result = calculateCosts({
        ...defaultParams,
        hasPackaging: true,
        packagingPlate,
        packagingQuantity: 100,
        packagingWidth: 200,
        packagingHeight: 150,
        packagingCuttingTimePerPoseSeconds: 0,
      })
      const platesNeeded = Math.ceil(100 / result.packagingItemsPerPlate)
      expect(result.packagingPlatesNeeded).toBe(platesNeeded)
      expect(result.packagingMaterialCost).toBeCloseTo(
        platesNeeded * packagingPlate.cost * MATERIAL_MARGIN_TIER2, 2
      )
    })

    it('calcule le coût découpe emballage (inclut setup)', () => {
      // 100 cartons × 30s = machineMinutes, + PACKAGING_SETUP_COST
      const result = calculateCosts({
        ...defaultParams,
        hasPackaging: true,
        packagingPlate,
        packagingQuantity: 100,
        packagingWidth: 200,
        packagingHeight: 150,
        packagingCuttingTimePerPoseSeconds: 30,
      })
      const machineMinutes = (30 * 100) / 60
      const expectedCutting = (machineMinutes / 60) * HOURLY_RATE_PACKAGING + PACKAGING_SETUP_COST
      expect(result.packagingCuttingCost).toBeCloseTo(expectedCutting, 2)
    })

    it('packagingTotalCost = matière + découpe', () => {
      const result = calculateCosts({
        ...defaultParams,
        hasPackaging: true,
        packagingPlate,
        packagingQuantity: 100,
        packagingWidth: 200,
        packagingHeight: 150,
        packagingCuttingTimePerPoseSeconds: 30,
      })
      expect(result.packagingTotalCost).toBeCloseTo(
        result.packagingMaterialCost + result.packagingCuttingCost, 2
      )
    })
  })
})
