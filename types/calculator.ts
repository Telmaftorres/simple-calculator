import type {
  ProductType as PrismaProductType,
  Plate as PrismaPlate,
  Accessory as PrismaAccessory,
  Consumable as PrismaConsumable,
  Element as PrismaElement,
} from '@prisma/client'
import type { ImpositionResult as BaseImpositionResult } from '@/lib/calculation/imposition'

export type Plate = Pick<PrismaPlate, 'id' | 'name' | 'width' | 'height' | 'cost' | 'material'>
export type Accessory = Pick<PrismaAccessory, 'id' | 'name' | 'price'>
export type Consumable = Pick<PrismaConsumable, 'id' | 'name' | 'price' | 'size'>
export type PLVElement = Pick<PrismaElement, 'id' | 'name' | 'quantity'>
export type ProductType = Pick<PrismaProductType, 'id' | 'name' | 'flatWidthFormula' | 'flatHeightFormula'> & {
  elements: PLVElement[]
}

export interface ImpositionResult extends BaseImpositionResult {
  platesNeeded: number
  materialCost: number
}

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

export interface Quote {
  id: number
  reference: string | null
  studyId: number
  productTypeId: number
  quantity: number
  width: number
  height: number
  flatWidth: number | null
  flatHeight: number | null
  printSurface: number | null
  printMode: string
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean
  hasFlatColor: boolean
  cuttingTimePerPoseSeconds: number
  assemblyTimePerPieceSeconds: number
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  plateId: number | null
  itemsPerPlate: number | null
  platesCount: number | null
  totalCost: number | null
  createdAt: Date
  hasPackaging: boolean
  packagingPlateId: number | null
  packagingQuantity: number | null
  packagingCuttingTimePerPoseSeconds: number
  packagingWidth: number | null
  packagingHeight: number | null
  hasPrintSetup: boolean   // ✅
  hasCuttingSetup: boolean // ✅
  study: { number: string } | null
  productType: { name: string; elements: { name: string; quantity: number }[] } | null
  plate: { name: string } | null
  accessories?: { accessoryId: number; quantity: number }[]
  consumables?: { consumableId: number; sizePerItem: number }[]
  elements: { name: string; quantity: number }[]
}

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