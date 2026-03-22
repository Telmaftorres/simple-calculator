import { describe, it, expect } from 'vitest'
import { calculateCosts } from '@/lib/calculation/costs'
import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  INK_COST_PER_LITER,
  INK_BASE_ML_PER_PLATE,
  PRINT_SETUP_TIME_MIN,
  CUTTING_SETUP_MINUTES,
  FINISHING_SURCHARGE_PERCENT,
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
  printSurfacePercent: 50,
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
      const result = calculateCosts({ ...defaultParams, hasFaconnage: true,assemblyTimePerPieceSeconds: 60 })
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
    it('retourne coûts à 0 si surface = 0', () => {
      const result = calculateCosts({ ...defaultParams, printSurfacePercent: 0 })
      expect(result.printingCostData.inkCost).toBe(0)
      expect(result.printingCostData.setupCost).toBe(0) 
    })

    it('double le coût si recto/verso', () => {
      const recto = calculateCosts({ ...defaultParams, isRectoVerso: false })
      const rectoVerso = calculateCosts({ ...defaultParams, isRectoVerso: true })
      expect(rectoVerso.printingCostData.inkCost).toBeGreaterThan(recto.printingCostData.inkCost)
    })

    it('applique le surcoût vernis', () => {
      const sans = calculateCosts({ ...defaultParams, hasVarnish: false })
      const avec = calculateCosts({ ...defaultParams, hasVarnish: true })
      const ratio = avec.printingCostData.inkCost / sans.printingCostData.inkCost
      expect(ratio).toBeCloseTo(1 + FINISHING_SURCHARGE_PERCENT, 5)
    })

    it('applique le surcoût aplat', () => {
      const sans = calculateCosts({ ...defaultParams, hasFlatColor: false })
      const avec = calculateCosts({ ...defaultParams, hasFlatColor: true })
      const ratio = avec.printingCostData.inkCost / sans.printingCostData.inkCost
      expect(ratio).toBeCloseTo(1 + FINISHING_SURCHARGE_PERCENT, 5)
    })

    it('cumule vernis + aplat', () => {
      const sans = calculateCosts({ ...defaultParams, hasVarnish: false, hasFlatColor: false })
      const avec = calculateCosts({ ...defaultParams, hasVarnish: true, hasFlatColor: true })
      const ratio = avec.printingCostData.inkCost / sans.printingCostData.inkCost
      expect(ratio).toBeCloseTo(1 + FINISHING_SURCHARGE_PERCENT * 2, 5)
    })

    it('ajoute le temps de calage si surface > 0', () => {
      const result = calculateCosts({ ...defaultParams, printSurfacePercent: 50 })
      const setupCost = (PRINT_SETUP_TIME_MIN / 60) * HOURLY_RATE_PRINT
      expect(result.printingCostData.laborCost).toBeGreaterThanOrEqual(setupCost)
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
      const result = calculateCosts({ ...defaultParams, hasAccessoires: true,selectedAccessories: accessories })
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

