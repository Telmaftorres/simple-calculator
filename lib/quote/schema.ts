import { z } from 'zod'

export const quoteFieldsSchema = z.object({
  client: z.string().optional(),
  contactName: z.string().optional(),
  productTypeId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  flatWidth: z.number().int().positive(),
  flatHeight: z.number().int().positive(),
  plateId: z.number().int().positive().nullable().optional(),
  plateCostOverride: z.number().positive().nullable().optional(),
  customPlateName: z.string().nullable().optional(),
  customPlateWidth: z.number().int().positive().nullable().optional(),
  customPlateHeight: z.number().int().positive().nullable().optional(),
  customPlateCost: z.number().positive().nullable().optional(),
  itemsPerPlate: z.number().int().min(0).nullable().optional(),
  platesCount: z.number().int().min(0).nullable().optional(),
  totalCost: z.number().min(0),

  inkMlPerPlate: z.number().min(0).max(100).optional(),
  inkMlVerso: z.number().min(0).max(100).optional(),
  varnishSurfacePercent: z.number().min(0).max(100).optional(),
  flatColorSurfacePercent: z.number().min(0).max(100).optional(),
  printMode: z.enum(['production', 'quality']).optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.enum(['identical', 'different']).nullable().optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  hasImpression: z.boolean().optional(),
  printSetupType: z.enum(['none', 'standard', 'complexe']).optional(),

  cuttingSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  cuttingTimePerPoseSeconds: z.number().int().optional(),
  machineTimeMinOverride: z.number().min(0).nullable().optional(),

  assemblyTimePerPieceSeconds: z.number().int().optional(),
  hasFaconnage: z.boolean().optional(),

  packTimePerPieceSeconds: z.number().int().optional(),
  hasAssemblyNotice: z.boolean().optional(),
  hasConditionnement: z.boolean().optional(),

  hasAccessoires: z.boolean().optional(),

  hasPackaging: z.boolean().optional(),
  packagingBoxType: z.enum(['etui', 'caisse', 'plaque_rainee']).optional(),
  packagingMaterialType: z.enum(['B', 'EB', 'C', 'BC']).optional(),
  packagingExternalSize: z.enum(['petit', 'moyen', 'grand']).nullable().optional(),
  packagingProductLength: z.number().int().min(0).nullable().optional(),
  packagingProductWidth: z.number().int().min(0).nullable().optional(),
  packagingProductHeight: z.number().int().min(0).nullable().optional(),
  packagingProductThickness: z.number().int().min(0).nullable().optional(),
  packagingPlateId: z.number().int().positive().nullable().optional(),
  packagingQuantity: z.number().int().positive().nullable().optional(),
  packagingCuttingTimePerPoseSeconds: z.number().int().optional(),
  packagingWidth: z.number().int().positive().nullable().optional(),
  packagingHeight: z.number().int().positive().nullable().optional(),

  isMultiProduct: z.boolean().optional(),
  plvQuantity: z.number().int().positive().nullable().optional(),

  hasBE: z.boolean().optional(),
  beTimeMinutes: z.number().int().min(0).optional(),
  batTimeMinutes: z.number().int().min(0).optional(),

  hasDossierFee: z.boolean().optional(),

  showMargeCommerciale: z.boolean().optional(),
  showMargeSopano: z.boolean().optional(),

  // ── Transport ──
  transportTotal: z.number().optional(),
})

const quoteProductSchema = z.object({
  position: z.number().int().min(0),
  productTypeId: z.number().int().positive().nullable().optional(),
  productTypeName: z.string().optional(),
  flatWidth: z.number().int().min(0),
  flatHeight: z.number().int().min(0),
  quantity: z.number().int().min(0),
  plateId: z.number().int().positive().nullable().optional(),
  itemsPerPlate: z.number().int().positive().nullable().optional(),
  platesCount: z.number().int().positive().nullable().optional(),
  printMode: z.enum(['production', 'quality']).optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.enum(['identical', 'different']).nullable().optional(),
  inkMlPerPlate: z.number().min(0).max(100).optional(),
  inkMlVerso: z.number().min(0).max(100).optional(),
  varnishSurfacePercent: z.number().min(0).max(100).optional(),
  flatColorSurfacePercent: z.number().min(0).max(100).optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  hasImpression: z.boolean().optional(),
  printSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  cuttingTimePerPoseSeconds: z.number().int().optional(),
  cuttingSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  totalCost: z.number().nullable().optional(),
  amalgameGroupIndex: z.number().int().min(0).nullable().optional(),
  countPerPlateInGroup: z.number().int().positive().nullable().optional(),
})

const transportDeliverySchema = z.object({
  transportMode: z.enum(['PACK30', 'MESSAGERIE_PLUS', 'AFFRETEMENT']),
  department:    z.string(),
  weightKg:      z.number().nullable().optional(),
  units:         z.number().int().min(1),
  optionsHT:     z.number().min(0),
  basePriceHT:   z.number().min(0),
  totalHT:       z.number().min(0),
})

const amalgameRunItemSchema = z.object({
  name: z.string().min(1),
  flatWidth: z.number().int().positive(),
  flatHeight: z.number().int().positive(),
  countPerPlate: z.number().int().positive(),
  quantityPerUnit: z.number().int().positive(),
})

const amalgameRunSchema = z.object({
  name: z.string().min(1),
  plateId: z.number().int().positive().nullable().optional(),
  hasImpression: z.boolean(),
  cuttingSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  cuttingTimePerPoseSeconds: z.number().min(0).optional(),
  printMode: z.enum(['production', 'quality']).optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.enum(['identical', 'different']).nullable().optional(),
  inkMlPerPlate: z.number().min(0).max(100).optional(),
  inkMlVerso: z.number().min(0).max(100).optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  varnishSurfacePercent: z.number().min(0).max(100).optional(),
  flatColorSurfacePercent: z.number().min(0).max(100).optional(),
  printSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  machineTimeMinOverride: z.number().min(0).nullable().optional(),
  mainPerPlate: z.number().int().positive().nullable().optional(),
  platesCount: z.number().int().min(0).nullable().optional(),
  position: z.number().int().min(0),
  items: z.array(amalgameRunItemSchema),
})

export const createQuoteSchema = quoteFieldsSchema.extend({
  studyNumber: z.string().min(1, 'Le numéro de dossier est requis'),
  parentReference: z.string().optional(),
  elements: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
  })),
  accessories: z.array(z.object({
    id: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).optional(),
  consumables: z.array(z.object({
    id: z.number().int().positive(),
    sizePerItem: z.number().positive(),
  })).optional(),
  products: z.array(quoteProductSchema).optional(),
  transportDeliveries: z.array(transportDeliverySchema).optional(),
  hasAmalgame: z.boolean().optional(),
  amalgameRuns: z.array(amalgameRunSchema).optional(),
})

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type QuoteFields = z.infer<typeof quoteFieldsSchema>