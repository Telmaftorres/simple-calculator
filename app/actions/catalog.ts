'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { z } from 'zod'
import { revalidateEntity } from '@/lib/server/cache'

const plateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  width: z.number().int().positive('La largeur doit être positive'),
  height: z.number().int().positive('La hauteur doit être positive'),
  cost: z.number().positive('Le coût doit être positif'),
  material: z.string().min(1, 'La matière est requise'),
})

const productTypeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  flatWidthFormula: z.string().optional(),
  flatHeightFormula: z.string().optional(),
})

const elementSchema = z.object({
  productTypeId: z.number().int().positive(),
  name: z.string().min(1, 'Le nom est requis'),
  quantity: z.number().int().positive('La quantité doit être positive'),
})

// ── PLATES ──

export async function createPlate(data: z.infer<typeof plateSchema>) {
  await requireAuth()
  const validated = plateSchema.parse(data)
  await prisma.plate.create({ data: validated })
  revalidateEntity('plates', '/dashboard/plates', '/')
}

export async function updatePlate(id: number, data: z.infer<typeof plateSchema>) {
  await requireAuth()
  const validated = plateSchema.parse(data)
  await prisma.plate.update({ where: { id }, data: validated })
  revalidateEntity('plates', '/dashboard/plates', '/')
}

export async function deletePlate(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.plate.delete({ where: { id: validId } })
  revalidateEntity('plates', '/dashboard/plates', '/')
}

// ── PRODUCT TYPES ──

export async function createProductType(
  name: string,
  flatWidthFormula?: string,
  flatHeightFormula?: string
) {
  await requireAuth()
  const validated = productTypeSchema.parse({ name, flatWidthFormula, flatHeightFormula })
  const result = await prisma.productType.create({
    data: {
      name: validated.name,
      flatWidthFormula: validated.flatWidthFormula || 'l',
      flatHeightFormula: validated.flatHeightFormula || 'L',
    },
  })
  revalidateEntity('product-types', '/dashboard/products', '/')
  return result
}

export async function updateProductType(
  id: number,
  name: string,
  flatWidthFormula?: string,
  flatHeightFormula?: string,
  imageUrl?: string | null,
) {
  await requireAuth()
  const validated = productTypeSchema.parse({ name, flatWidthFormula, flatHeightFormula })
  await prisma.productType.update({
    where: { id },
    data: {
      name: validated.name,
      flatWidthFormula: validated.flatWidthFormula || undefined,
      flatHeightFormula: validated.flatHeightFormula || undefined,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  })
  revalidateEntity('product-types', '/dashboard/products', '/')
}

export async function deleteProductType(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.productType.delete({ where: { id: validId } })
  revalidateEntity('product-types', '/dashboard/products', '/')
}

// ── PRODUCT TEMPLATES ──

const productTemplateSchema = z.object({
  productTypeId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, 'Le nom est requis'),
  formatType: z.enum(['2d', '3d']).optional(),
  flatWidth: z.number().int().positive().nullable().optional(),
  flatDepth: z.number().int().positive().nullable().optional(),
  flatHeight: z.number().int().positive().nullable().optional(),
  plateId: z.number().int().positive().nullable().optional(),
  hasImpression: z.boolean().optional(),
  printMode: z.enum(['production', 'quality']).optional(),
  printSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.enum(['identical', 'different']).nullable().optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  inkMlPerPlate: z.number().int().min(0).max(100).optional(),
  inkMlVerso: z.number().int().min(0).max(100).optional(),
  varnishSurfacePercent: z.number().int().min(0).max(100).optional(),
  flatColorSurfacePercent: z.number().int().min(0).max(100).optional(),
  cuttingTimePerPoseSeconds: z.number().int().min(0).optional(),
  cuttingSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  hasFaconnage: z.boolean().optional(),
  assemblyTimePerPieceSeconds: z.number().int().min(0).optional(),
  hasConditionnement: z.boolean().optional(),
  packTimePerPieceSeconds: z.number().int().min(0).optional(),
  hasAssemblyNotice: z.boolean().optional(),
  hasAccessoires: z.boolean().optional(),
  hasTransport: z.boolean().optional(),
  defaultTransportMode: z.enum(['PACK30', 'MESSAGERIE_PLUS', 'AFFRETEMENT']).nullable().optional(),
  hasAmalgame: z.boolean().optional(),
  amalgameGroupsJson: z.string().nullable().optional(),
  notes: z.string().optional(),
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
  mainPerPlate: z.number().int().positive().nullable().optional(),
  position: z.number().int().min(0).optional(),
  items: z.array(amalgameRunItemSchema),
})

const templateAccessorySchema = z.object({
  accessoryId: z.number().int().positive(),
  quantity: z.number().int().positive(),
})

const templateElementSchema = z.object({
  elementId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  flatWidth: z.number().int().positive().optional().nullable(),
  flatHeight: z.number().int().positive().optional().nullable(),
  flatDepth: z.number().int().positive().optional().nullable(),
  plateId: z.number().int().positive().optional().nullable(),
  amalgameGroupId: z.string().nullable().optional(),
  hasImpression: z.boolean().optional(),
  printMode: z.enum(['production', 'quality']).optional(),
  printSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.enum(['identical', 'different']).nullable().optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  inkMlPerPlate: z.number().int().min(0).optional(),
  inkMlVerso: z.number().int().min(0).optional(),
  varnishSurfacePercent: z.number().int().min(0).max(100).optional(),
  flatColorSurfacePercent: z.number().int().min(0).max(100).optional(),
  cuttingTimePerPoseSeconds: z.number().int().min(0).optional(),
  cuttingSetupType: z.enum(['none', 'standard', 'complexe']).optional(),
})

const templateVariantConfigSchema = z.object({
  variantId: z.number().int().positive(),
  defaultQuantity: z.number().int().positive(),
})

const templateOptionConfigSchema = z.object({
  optionId: z.number().int().positive(),
  defaultQuantity: z.number().int().min(0),
})

export async function createProductTemplate(
  data: z.infer<typeof productTemplateSchema>,
  accessories: z.infer<typeof templateAccessorySchema>[] = [],
  amalgameRuns: z.infer<typeof amalgameRunSchema>[] = [],
  elements: z.infer<typeof templateElementSchema>[] = [],
  variantConfigs: z.infer<typeof templateVariantConfigSchema>[] = [],
  optionConfigs: z.infer<typeof templateOptionConfigSchema>[] = [],
) {
  await requireAuth()
  const validated = productTemplateSchema.parse(data)
  const validatedAccessories = accessories.map((a) => templateAccessorySchema.parse(a))
  const validatedRuns = amalgameRuns.map((r) => amalgameRunSchema.parse(r))
  const validatedElements = elements.map((e) => templateElementSchema.parse(e))
  const validatedVariants = variantConfigs.map((v) => templateVariantConfigSchema.parse(v))
  const validatedOptions = optionConfigs.map((o) => templateOptionConfigSchema.parse(o))
  const result = await prisma.productTemplate.create({
    data: {
      ...validated,
      accessories: validatedAccessories.length > 0 ? { create: validatedAccessories } : undefined,
      amalgameRuns: validatedRuns.length > 0
        ? { create: validatedRuns.map(({ items, ...run }) => ({ ...run, items: { create: items } })) }
        : undefined,
      templateElements: validatedElements.length > 0 ? { create: validatedElements } : undefined,
      templateVariants: validatedVariants.length > 0 ? { create: validatedVariants } : undefined,
      templateOptionConfigs: validatedOptions.length > 0 ? { create: validatedOptions } : undefined,
    },
  })
  if (validated.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${validated.productTypeId}`, '/dashboard/products')
  }
  return result
}

export async function updateProductTemplate(
  id: number,
  data: z.infer<typeof productTemplateSchema>,
  accessories: z.infer<typeof templateAccessorySchema>[] = [],
  amalgameRuns: z.infer<typeof amalgameRunSchema>[] = [],
  elements: z.infer<typeof templateElementSchema>[] = [],
  variantConfigs: z.infer<typeof templateVariantConfigSchema>[] = [],
  optionConfigs: z.infer<typeof templateOptionConfigSchema>[] = [],
) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const validated = productTemplateSchema.parse(data)
  const validatedAccessories = accessories.map((a) => templateAccessorySchema.parse(a))
  const validatedRuns = amalgameRuns.map((r) => amalgameRunSchema.parse(r))
  const validatedElements = elements.map((e) => templateElementSchema.parse(e))
  const validatedVariants = variantConfigs.map((v) => templateVariantConfigSchema.parse(v))
  const validatedOptions = optionConfigs.map((o) => templateOptionConfigSchema.parse(o))
  const result = await prisma.productTemplate.update({
    where: { id: validId },
    data: {
      ...validated,
      accessories: { deleteMany: {}, create: validatedAccessories },
      amalgameRuns: {
        deleteMany: {},
        create: validatedRuns.map(({ items, ...run }) => ({ ...run, items: { create: items } })),
      },
      templateElements: { deleteMany: {}, create: validatedElements },
      templateVariants: { deleteMany: {}, create: validatedVariants },
      templateOptionConfigs: { deleteMany: {}, create: validatedOptions },
    },
  })
  if (validated.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${validated.productTypeId}`, '/dashboard/products')
  }
  return result
}

export async function deleteProductTemplate(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const tpl = await prisma.productTemplate.findUnique({ where: { id: validId }, select: { productTypeId: true } })
  await prisma.productTemplate.delete({ where: { id: validId } })
  if (tpl?.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${tpl.productTypeId}`, '/dashboard/products')
  }
}

// ── ELEMENTS ──

export async function createElement(data: z.infer<typeof elementSchema>) {
  await requireAuth()
  const validated = elementSchema.parse(data)
  await prisma.element.create({ data: validated })
  revalidateEntity('product-types', `/dashboard/products/${validated.productTypeId}`, '/dashboard/products')
}

export async function updateElement(
  id: number,
  productTypeId: number,
  data: { name: string; quantity: number }
) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const validProductTypeId = z.number().int().positive().parse(productTypeId)
  const validated = elementSchema.omit({ productTypeId: true }).parse(data)
  await prisma.element.update({
    where: { id: validId, productTypeId: validProductTypeId },
    data: validated,
  })
  revalidateEntity('product-types', `/dashboard/products/${validProductTypeId}`, '/dashboard/products')
}

export async function deleteElement(id: number, productTypeId: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const validProductTypeId = z.number().int().positive().parse(productTypeId)
  await prisma.element.delete({
    where: { id: validId, productTypeId: validProductTypeId },
  })
  revalidateEntity('product-types', `/dashboard/products/${validProductTypeId}`, '/dashboard/products')
}

// ── PRODUCT OPTIONS ──

const productOptionSchema = z.object({
  productTypeId: z.number().int().positive(),
  name: z.string().min(1, 'Le nom est requis'),
  inputType: z.enum(['single_choice', 'multi_item']),
  priceHT: z.number().min(0).nullable().optional(),
  position: z.number().int().min(0).optional(),
})

const productOptionVariantSchema = z.object({
  optionId: z.number().int().positive(),
  label: z.string().min(1, 'Le libellé est requis'),
  priceHT: z.number().min(0).nullable().optional(),
  position: z.number().int().min(0).optional(),
})

export async function createProductOption(data: z.infer<typeof productOptionSchema>) {
  await requireAuth()
  const validated = productOptionSchema.parse(data)
  await prisma.productOption.create({ data: validated })
  revalidateEntity('product-types', `/dashboard/products/${validated.productTypeId}`, '/dashboard/products')
}

export async function updateProductOption(id: number, data: Partial<z.infer<typeof productOptionSchema>>) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const option = await prisma.productOption.findUnique({ where: { id: validId }, select: { productTypeId: true } })
  await prisma.productOption.update({ where: { id: validId }, data })
  if (option?.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${option.productTypeId}`, '/dashboard/products')
  }
}

export async function deleteProductOption(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const option = await prisma.productOption.findUnique({ where: { id: validId }, select: { productTypeId: true } })
  await prisma.productOption.delete({ where: { id: validId } })
  if (option?.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${option.productTypeId}`, '/dashboard/products')
  }
}

export async function createProductOptionVariant(data: z.infer<typeof productOptionVariantSchema>) {
  await requireAuth()
  const validated = productOptionVariantSchema.parse(data)
  const option = await prisma.productOption.findUnique({ where: { id: validated.optionId }, select: { productTypeId: true } })
  await prisma.productOptionVariant.create({ data: validated })
  if (option?.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${option.productTypeId}`, '/dashboard/products')
  }
}

export async function updateProductOptionVariant(id: number, data: { label: string; priceHT?: number | null }) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const variant = await prisma.productOptionVariant.findUnique({
    where: { id: validId },
    select: { option: { select: { productTypeId: true } } },
  })
  await prisma.productOptionVariant.update({ where: { id: validId }, data })
  if (variant?.option.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${variant.option.productTypeId}`, '/dashboard/products')
  }
}

export async function deleteProductOptionVariant(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const variant = await prisma.productOptionVariant.findUnique({
    where: { id: validId },
    select: { option: { select: { productTypeId: true } } },
  })
  await prisma.productOptionVariant.delete({ where: { id: validId } })
  if (variant?.option.productTypeId) {
    revalidateEntity('product-types', `/dashboard/products/${variant.option.productTypeId}`, '/dashboard/products')
  }
}
