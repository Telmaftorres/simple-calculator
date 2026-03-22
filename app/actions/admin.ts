'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/cache'

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
  revalidatePath('/dashboard/plates')
  revalidatePath('/')
  revalidateCache('plates')
}

export async function updatePlate(id: number, data: z.infer<typeof plateSchema>) {
  await requireAuth()
  const validated = plateSchema.parse(data)
  await prisma.plate.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/plates')
  revalidatePath('/')
  revalidateCache('plates')
}

export async function deletePlate(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.plate.delete({ where: { id: validId } })
  revalidatePath('/dashboard/plates')
  revalidatePath('/')
  revalidateCache('plates')
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
  revalidatePath('/dashboard/products')
  revalidatePath('/')
  revalidateCache('product-types')
  return result
}

export async function updateProductType(
  id: number,
  name: string,
  flatWidthFormula?: string,
  flatHeightFormula?: string
) {
  await requireAuth()
  const validated = productTypeSchema.parse({ name, flatWidthFormula, flatHeightFormula })
  await prisma.productType.update({
    where: { id },
    data: {
      name: validated.name,
      flatWidthFormula: validated.flatWidthFormula || undefined,
      flatHeightFormula: validated.flatHeightFormula || undefined,
    },
  })
  revalidatePath('/dashboard/products')
  revalidatePath('/')
  revalidateCache('product-types')
}

export async function deleteProductType(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.productType.delete({ where: { id: validId } })
  revalidatePath('/dashboard/products')
  revalidatePath('/')
  revalidateCache('product-types')
}

// ── ELEMENTS ──

export async function createElement(data: z.infer<typeof elementSchema>) {
  await requireAuth()
  const validated = elementSchema.parse(data)
  await prisma.element.create({ data: validated })
  revalidatePath(`/dashboard/products/${validated.productTypeId}`)
  revalidatePath('/dashboard/products')
  revalidateCache('product-types')
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
  revalidatePath(`/dashboard/products/${validProductTypeId}`)
  revalidatePath('/dashboard/products')
  revalidateCache('product-types')
}

export async function deleteElement(id: number, productTypeId: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const validProductTypeId = z.number().int().positive().parse(productTypeId)
  await prisma.element.delete({
    where: { id: validId, productTypeId: validProductTypeId },
  })
  revalidatePath(`/dashboard/products/${validProductTypeId}`)
  revalidatePath('/dashboard/products')
  revalidateCache('product-types')
}
