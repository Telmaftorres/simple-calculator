import { describe, it, expect } from 'vitest'
import { calculateCosts } from '@/lib/calculation/costs'
import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  INK_COST_PER_LITER,
  INK_COST_VARNISH_PER_LITER,
  INK_COST_FLAT_COLOR_PER_LITER,
  PRINT_SETUP_TIME_MIN,
  CUTTING_SETUP_MINUTES,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
} from '@/lib/constants'

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
  hasPrintSetup: true,
  hasCuttingSetup: true,
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

    it('totalCost = matière + impression + découpe + façonnage + conditionnement + accessoires + consommables', () => {
      const result = calculateCosts(defaultParams)
      const expected =
        mockImpositionResult.materialCost +
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
      const setupTimeMin = CUTTING_SETUP_MINUTES
      const totalTimeMin = machineTimeMin + setupTimeMin
      const expected = (totalTimeMin / 60) * HOURLY_RATE_PRINT
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
      const timeCost = (30 * 100 / 3600) * HOURLY_RATE_ASSEMBLY
      const noticeCost = ASSEMBLY_NOTICE_COST_PER_PIECE * 100
      expect(result.packagingCost).toBeCloseTo(timeCost + noticeCost, 2)
    })
  })

  describe('printingCostData', () => {
    it('retourne coûts à 0 si inkMlPerPlate = 0', () => {
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 0 })
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
      // 20 ml × 5 plaques = 100 ml = 0.1 L × 95 €/L = 9.50 €
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 20 })
      const expectedInkCost = (20 * 5 / 1000) * INK_COST_PER_LITER
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
      const expected = standardVolumeL * INK_COST_PER_LITER + varnishVolumeL * INK_COST_VARNISH_PER_LITER
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
      const expected = standardVolumeL * INK_COST_PER_LITER + flatColorVolumeL * INK_COST_FLAT_COLOR_PER_LITER
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
      const expectedVernis = (20 * 1 * 5 / 1000) * INK_COST_PER_LITER + varnishVolumeL * INK_COST_VARNISH_PER_LITER
      const expectedAplat = (20 * 1 * 5 / 1000) * INK_COST_PER_LITER + flatColorVolumeL * INK_COST_FLAT_COLOR_PER_LITER
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
        standardVolumeL * INK_COST_PER_LITER +
        varnishVolumeL * INK_COST_VARNISH_PER_LITER +
        flatColorVolumeL * INK_COST_FLAT_COLOR_PER_LITER
      expect(avec.printingCostData.inkCost).toBeCloseTo(expected, 2)
      // Volume est plus grand
      expect(avec.inkVolumeL).toBeGreaterThan(sans.inkVolumeL)
      // Coût plus élevé car finitions > encre standard
      expect(avec.printingCostData.inkCost).toBeGreaterThan(sans.printingCostData.inkCost)
    })

    it('ajoute le calage si inkMlPerPlate > 0', () => {
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 20 })
      const setupCost = (PRINT_SETUP_TIME_MIN / 60) * HOURLY_RATE_PRINT
      expect(result.printingCostData.laborCost).toBeGreaterThanOrEqual(setupCost)
    })

    it('pas de calage si inkMlPerPlate = 0', () => {
      const result = calculateCosts({ ...defaultParams, inkMlPerPlate: 0 })
      expect(result.printingCostData.setupCost).toBe(0)
      expect(result.printingCostData.setupTimeMin).toBe(0)
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
})

