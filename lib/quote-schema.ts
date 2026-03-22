import { z } from 'zod'

export const quoteFieldsSchema = z.object({
  // Identité
  productTypeId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  flatWidth: z.number().int().positive(),
  flatHeight: z.number().int().positive(),
  plateId: z.number().int().positive(),
  itemsPerPlate: z.number().int().positive(),
  platesCount: z.number().int().positive(),
  totalCost: z.number().min(0),

  // Impression
  printSurface: z.number().min(0).max(100).optional(),
  printMode: z.string().optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.string().nullable().optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  hasImpression: z.boolean().optional(),
  hasPrintSetup: z.boolean().optional(),

  // Découpe
  cuttingTimePerPoseSeconds: z.number().int().optional(),
  hasCuttingSetup: z.boolean().optional(),

  // Façonnage
  assemblyTimePerPieceSeconds: z.number().int().optional(),
  hasFaconnage: z.boolean().optional(),

  // Conditionnement
  packTimePerPieceSeconds: z.number().int().optional(),
  hasAssemblyNotice: z.boolean().optional(),
  hasConditionnement: z.boolean().optional(),

  // Accessoires
  hasAccessoires: z.boolean().optional(),

  // Emballage
  hasPackaging: z.boolean().optional(),
  packagingPlateId: z.number().int().positive().nullable().optional(),
  packagingQuantity: z.number().int().positive().nullable().optional(),
  packagingCuttingTimePerPoseSeconds: z.number().int().optional(),
  packagingWidth: z.number().int().positive().nullable().optional(),
  packagingHeight: z.number().int().positive().nullable().optional(),
})

export const createQuoteSchema = quoteFieldsSchema.extend({
  // Champs spécifiques à la création
  studyNumber: z.string().min(1, 'Le numéro de dossier est requis'),
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
})

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type QuoteFields = z.infer<typeof quoteFieldsSchema>