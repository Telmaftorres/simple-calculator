'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath, revalidateTag } from 'next/cache'

// ────────────────────────────────────────────────────
// Schemas de validation Zod
// ────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────
// Helper : vérification d'authentification
// ────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')
  return session
}

// ────────────────────────────────────────────────────
// PLATES
// ────────────────────────────────────────────────────

export async function createPlate(data: z.infer<typeof plateSchema>) {
  await requireAuth()
  const validated = plateSchema.parse(data)
  await prisma.plate.create({ data: validated })
  revalidatePath('/dashboard/plates')
  revalidatePath('/')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('plates')
}

export async function updatePlate(id: number, data: z.infer<typeof plateSchema>) {
  await requireAuth()
  const validated = plateSchema.parse(data)
  await prisma.plate.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/plates')
  revalidatePath('/')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('plates')
}

export async function deletePlate(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.plate.delete({ where: { id: validId } })
  revalidatePath('/dashboard/plates')
  revalidatePath('/')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('plates')
}

// ────────────────────────────────────────────────────
// PRODUCT TYPES
// ────────────────────────────────────────────────────

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
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('product-types')
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
      flatWidthFormula: validated.flatWidthFormula,
      flatHeightFormula: validated.flatHeightFormula,
    },
  })
  revalidatePath('/dashboard/products')
  revalidatePath('/')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('product-types')
}

export async function deleteProductType(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.productType.delete({ where: { id: validId } })
  revalidatePath('/dashboard/products')
  revalidatePath('/')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('product-types')
}

// ────────────────────────────────────────────────────
// ELEMENTS
// ────────────────────────────────────────────────────

export async function createElement(data: z.infer<typeof elementSchema>) {
  await requireAuth()
  const validated = elementSchema.parse(data)
  await prisma.element.create({ data: validated })
  revalidatePath(`/dashboard/products/${validated.productTypeId}`)
  revalidatePath('/dashboard/products')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('product-types')
}

export async function updateElement(
  id: number,
  productTypeId: number,
  data: { name: string; quantity: number }
) {
  await requireAuth()
  const validated = elementSchema.omit({ productTypeId: true }).parse(data)
  await prisma.element.update({ where: { id }, data: validated })
  revalidatePath(`/dashboard/products/${productTypeId}`)
  revalidatePath('/dashboard/products')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('product-types')
}

export async function deleteElement(id: number, productTypeId: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.element.delete({ where: { id: validId } })
  revalidatePath(`/dashboard/products/${productTypeId}`)
  revalidatePath('/dashboard/products')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('product-types')
}
