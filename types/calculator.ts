import type {
  ProductType as PrismaProductType,
  Plate as PrismaPlate,
  Accessory as PrismaAccessory,
  Consumable as PrismaConsumable,
  Element as PrismaElement,
  Prisma,
} from '@prisma/client'
import type { ImpositionResult as BaseImpositionResult } from '@/lib/calculation/imposition'

// ── Types Prisma simplifiés ──
export type Plate = Pick<PrismaPlate, 'id' | 'name' | 'width' | 'height' | 'cost' | 'material'>
export type Accessory = Pick<PrismaAccessory, 'id' | 'name' | 'price'>
export type Consumable = Pick<PrismaConsumable, 'id' | 'name' | 'price' | 'size'>
export type PLVElement = Pick<PrismaElement, 'id' | 'name' | 'quantity'>
export type ProductType = Pick<PrismaProductType, 'id' | 'name' | 'flatWidthFormula' | 'flatHeightFormula'> & {
  elements: PLVElement[]
}

// ── ImpositionResult étendu ──
export interface ImpositionResult extends BaseImpositionResult {
  platesNeeded: number
  materialCost: number
}

// ── Types métier calculateur ──
export interface SelectedAccessory {
  id: number
  name: string
  price: number
  quantity: number
}

export interface SelectedConsumable {
  id: number
  name: string
  price: number
  size: number
  sizePerItem: number
  quantity: number
}

export interface PrintingCostData {
  cost: number
  timeMin: number
  inkCost: number
  laborCost: number
  inkVolumeL: number
  setupCost: number
  machineCost: number
  setupTimeMin: number
  machineTimeMin: number
}

export type Quote = Prisma.QuoteGetPayload<{
  include: {
    study: true
    productType: {
      include: { elements: true }
    }
    plate: true
    accessories: {
      include: { accessory: true }
    }
    consumables: {
      include: { consumable: true }
    }
    elements: true
    products: {          // ← ajouter
      include: {
        plate: true
      }
    }
  }
}>

export interface CalculatorProps {
  productTypes: ProductType[]
  plates: Plate[]
  accessories: Accessory[]
  consumables: Consumable[]
  isAdmin: boolean
  initialQuote?: Quote
  isViewOnly?: boolean
  settings?: Record<string, number>
}

export type ScreenState = 'form' | 'success' | 'recap'
export type PrintMode = 'production' | 'quality'

// ── Multi-produits ──

export interface ProductSlot {
  id: string                          // identifiant local (uuid) — pas l'id DB
  productTypeId: string
  productSearch: string
  flatWidth: number
  flatHeight: number
  quantity: number
  selectedPlateId: string
  printMode: 'production' | 'quality'
  isRectoVerso: boolean
  rectoVersoType: string | null
  inkMlPerPlate: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  hasVarnish: boolean
  hasFlatColor: boolean
  hasImpression: boolean
  printSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  cuttingTimePerPoseSeconds: number

}

export const DEFAULT_PRODUCT_SLOT: ProductSlot = {
  id: '',
  productTypeId: '',
  productSearch: '',
  flatWidth: 0,
  flatHeight: 0,
  quantity: 100,
  selectedPlateId: '',
  printMode: 'production',
  isRectoVerso: false,
  rectoVersoType: null,
  inkMlPerPlate: 20,
  varnishSurfacePercent: 0,
  flatColorSurfacePercent: 0,
  hasVarnish: false,
  hasFlatColor: false,
  hasImpression: true,
  printSetupType: 'none',
  cuttingSetupType: 'none',
  cuttingTimePerPoseSeconds: 0,
}

export interface ProductSlotResult {
  slot: ProductSlot
  impositionResult: ImpositionResult | null
  costResult: {
    materialCost: number
    printingCost: number
    printingCostData: PrintingCostData
    cuttingCost: number
    cuttingMachineCost: number
    cuttingSetupCost: number
    cuttingMachineTimeMin: number
    cuttingSetupTimeMin: number
    inkVolumeL: number
    subtotal: number
  }
}