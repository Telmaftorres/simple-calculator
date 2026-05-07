import type {
  ProductType as PrismaProductType,
  Plate as PrismaPlate,
  Accessory as PrismaAccessory,
  Consumable as PrismaConsumable,
  Element as PrismaElement,
  Prisma,
} from '@prisma/client'
import type { ImpositionResult as BaseImpositionResult } from '@/lib/calculation/imposition'
import type { MultiImpositionResult } from '@/lib/calculation/amalgame-multi-imposition'

// ── Types Prisma simplifiés ──
export type Plate = Pick<PrismaPlate, 'id' | 'name' | 'width' | 'height' | 'cost' | 'material'>
export type Accessory = Pick<PrismaAccessory, 'id' | 'name' | 'price'>
export type Consumable = Pick<PrismaConsumable, 'id' | 'name' | 'price' | 'size'>
export type PLVElement = Pick<PrismaElement, 'id' | 'name' | 'quantity'>
export type TemplateAmalgameRunItem = {
  name: string
  flatWidth: number
  flatHeight: number
  countPerPlate: number
  quantityPerUnit: number
}

export type TemplateAmalgameRun = {
  name: string
  plateId: number | null
  hasImpression: boolean
  mainPerPlate: number | null
  position: number
  items: TemplateAmalgameRunItem[]
}

export type ProductTemplate = {
  id: number
  name: string
  formatType: string
  flatWidth: number | null
  flatDepth: number | null
  flatHeight: number | null
  plateId: number | null
  hasImpression: boolean
  printMode: string
  printSetupType: string
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean
  hasFlatColor: boolean
  inkMlPerPlate: number
  inkMlVerso: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  cuttingTimePerPoseSeconds: number
  cuttingSetupType: string
  hasFaconnage: boolean
  assemblyTimePerPieceSeconds: number
  hasConditionnement: boolean
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  hasAccessoires: boolean
  hasTransport: boolean
  defaultTransportMode: string | null
  hasAmalgame: boolean
  amalgameGroupsJson: string | null
  accessories: Array<{
    accessoryId: number
    quantity: number
    accessory: { id: number; name: string; price: number }
  }>
  amalgameRuns: TemplateAmalgameRun[]
  templateVariants: Array<{
    variantId: number
    defaultQuantity: number
    variant: {
      id: number
      label: string
      priceHT: number | null
      option: { id: number; name: string; inputType: string }
    }
  }>
  templateElements: Array<{
    elementId: number
    quantity: number
    flatWidth: number | null
    flatHeight: number | null
    flatDepth: number | null
    plateId: number | null
    amalgameGroupId: string | null
    hasImpression: boolean
    printMode: string
    printSetupType: string
    isRectoVerso: boolean
    rectoVersoType: string | null
    hasVarnish: boolean
    hasFlatColor: boolean
    inkMlPerPlate: number
    inkMlVerso: number
    varnishSurfacePercent: number
    flatColorSurfacePercent: number
    cuttingTimePerPoseSeconds: number
    cuttingSetupType: string
    element: { id: number; name: string }
  }>
  templateOptionConfigs: Array<{
    optionId: number
    defaultQuantity: number
    option: { id: number; name: string; inputType: string; priceHT: number | null }
  }>
}

export type ProductType = Pick<PrismaProductType, 'id' | 'name' | 'flatWidthFormula' | 'flatHeightFormula'> & {
  elements: PLVElement[]
  templates: ProductTemplate[]
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

// ── Transport multi-livraisons ──
export interface TransportDeliveryForm {
  id: string               // UUID local (clé React)
  mode: 'PACK30' | 'MESSAGERIE_PLUS' | 'AFFRETEMENT' | undefined
  department: string | undefined
  weightKg: number | undefined
  units: number
  optionsHT: number
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
    products: {
      include: {
        plate: true
      }
    }
    transportDeliveries: true
    amalgameRuns: {
      include: {
        plate: true
        items: true
      }
    }
  }
}>

export type CalculatorMode = 'quote' | 'production' | 'actuals'

export interface CalculatorProps {
  productTypes: ProductType[]
  plates: Plate[]
  accessories: Accessory[]
  consumables: Consumable[]
  isAdmin: boolean
  initialQuote?: Quote
  isViewOnly?: boolean
  settings?: Record<string, number>
  packagingRules?: import('@/app/actions/reference-data').PackagingRulesData
  mode?: CalculatorMode
  targetQuoteId?: number
  // Extra data passed when in production/actuals mode
  productionSheetExtra?: {
    status?: string
    remarques?: string | null
    planImageUrl?: string | null
    nbCollages?: number | null
    collagePerPLV?: number | null
    faconnageNotes?: string | null
    conditionnementType?: string | null
    conditionnementNotes?: string | null
    achatsNotes?: string | null
  } | null
}

export type ScreenState = 'form' | 'success' | 'recap'
export type PrintMode = 'production' | 'quality'

// ── Multi-produits ──

// ── Groupes d'amalgame ──
export const GROUP_COLORS = [
  { dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700 border-violet-200', ring: 'ring-violet-300' },
  { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200',       ring: 'ring-blue-300' },
  { dot: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', ring: 'ring-emerald-300' },
  { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 border-amber-200',    ring: 'ring-amber-300' },
  { dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700 border-rose-200',       ring: 'ring-rose-300' },
  { dot: 'bg-cyan-500',   badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',       ring: 'ring-cyan-300' },
] as const

export interface AmalgameGroup {
  id: string
  name: string
  colorIndex: number
  amalgameType: 'impression_decoupe' | 'decoupe'
  plateId: string                                      // plaque commune (impression ou découpe)
  cuttingTimePerPoseSeconds: number                    // temps découpe par plaque, commun au groupe
  cuttingSetupType: 'none' | 'standard' | 'complexe'  // calage commun au groupe
  // Impression (seulement pour impression_decoupe)
  printMode: 'production' | 'quality'
  isRectoVerso: boolean
  rectoVersoType: 'identical' | 'different' | null
  inkMlPerPlate: number
  inkMlVerso: number
  hasVarnish: boolean
  hasFlatColor: boolean
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  printSetupType: 'none' | 'standard' | 'complexe'
}

export interface AmalgameGroupResult {
  groupId: string
  platesCount: number
  materialCostRaw: number
  materialCostMarged: number
  machineTimeMin: number
  printingCost: number
  cuttingMachineTimeMin: number
  cuttingMachineCost: number
  cuttingSetupCost: number
  totalCost: number
  multiImposition: MultiImpositionResult | null
}

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
  rectoVersoType: 'identical' | 'different' | null
  inkMlPerPlate: number
  inkMlVerso: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  hasVarnish: boolean
  hasFlatColor: boolean
  hasImpression: boolean
  printSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  cuttingTimePerPoseSeconds: number
  orientationOverride: 'normal' | 'rotated' | null
  amalgameGroupId: string | null
  countPerPlateInGroup: number
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
  inkMlVerso: 0,
  varnishSurfacePercent: 0,
  flatColorSurfacePercent: 0,
  hasVarnish: false,
  hasFlatColor: false,
  hasImpression: true,
  printSetupType: 'none',
  cuttingSetupType: 'none',
  cuttingTimePerPoseSeconds: 0,
  orientationOverride: null,
  amalgameGroupId: null,
  countPerPlateInGroup: 0,
}

export interface ProductSlotResult {
  slot: ProductSlot
  impositionResult: ImpositionResult | null
  costResult: {
    materialCost: number
    materialCostMarged: number
    materialMarginCoeff: number
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
