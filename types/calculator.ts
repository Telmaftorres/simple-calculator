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

export interface CalculatorProps {
  productTypes: ProductType[]
  plates: Plate[]
  accessories: Accessory[]
  isAdmin: boolean
}

export type ScreenState = 'form' | 'success' | 'recap'
export type PrintMode = 'production' | 'quality'
