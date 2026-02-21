import { Rect } from '@/lib/calculation/imposition'

// ────────────────────────────────────────────────────
// Types Prisma (miroir des modèles)
// ────────────────────────────────────────────────────

export interface ProductType {
  id: number
  name: string
  flatWidthFormula: string
  flatHeightFormula: string
  elements: Element[]
}

export interface Element {
  id: number
  name: string
  quantity: number
}

export interface Plate {
  id: number
  name: string
  width: number
  height: number
  cost: number
  material: string
}

export interface Accessory {
  id: number
  name: string
  price: number
}

// ────────────────────────────────────────────────────
// Types métier (spécifiques au calculateur)
// ────────────────────────────────────────────────────

export interface SelectedAccessory {
  id: number
  name: string
  price: number
  quantity: number
}

export interface ImpositionResult {
  itemsPerPlate: number
  platesNeeded: number
  materialCost: number
  orientation: string
  layout: Rect[]
}

export interface PrintingCostData {
  cost: number
  timeMin: number
  inkCost: number
  laborCost: number
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
  rectoVersoType: 'identical' | 'different' | null
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
  study: { number: string } | null
  productType: { name: string; elements: { name: string; quantity: number }[] } | null
  plate: { name: string } | null
  accessories?: { accessoryId: number; quantity: number }[]
  elements: { name: string; quantity: number }[]
}

export interface CalculatorProps {
  productTypes: ProductType[]
  plates: Plate[]
  accessories: Accessory[]
  isAdmin: boolean
  initialQuote?: Quote
  isViewOnly?: boolean
}

export type ScreenState = 'form' | 'success' | 'recap'
export type PrintMode = 'production' | 'quality'
