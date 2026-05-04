'use server'

import { prisma } from '@/lib/server/prisma'
import { type Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { revalidateCache } from '@/lib/server/cache'
import { createQuoteSchema, type CreateQuoteInput } from '@/lib/quote/schema'
import { logAction } from '@/lib/server/audit'

function buildQuoteData(
  validated: CreateQuoteInput,
  extra: { reference: string; studyId: number; userId: string }
): Omit<Prisma.QuoteUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'> {
  const {
    studyNumber,
    elements,
    accessories,
    consumables,
    products,
    transportDeliveries,
    parentReference,
    ...quoteFields
  } = validated

  return {
    ...quoteFields,
    ...extra,
    parentReference: parentReference ?? null,
    packagingPlateId: validated.packagingPlateId ?? null,
    packagingQuantity: validated.packagingQuantity ?? null,
    packagingWidth: validated.packagingWidth ?? null,
    packagingHeight: validated.packagingHeight ?? null,
    isMultiProduct: validated.isMultiProduct ?? false,
  }
}

async function generateReference(parentReference?: string): Promise<string> {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)

  if (parentReference) {
    const base = parentReference.replace(/-[A-Z]$/, '')
    const existing = await prisma.quote.findMany({
      where: { reference: { startsWith: base } },
      select: { reference: true },
    })
    const usedLetters = existing
      .map((q) => q.reference?.split('-').pop() || '')
      .filter((s) => /^[A-Z]$/.test(s))
    const nextLetter = String.fromCharCode(65 + usedLetters.length)
    return `${base}-${nextLetter}`
  }

  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('quote_reference_seq')`
  const number = String(Number(result[0].nextval)).padStart(3, '0')
  return `C${number}-${month}${year}`
}

export async function createQuote(data: CreateQuoteInput) {
  const session = await requireAuth()
  const validated = createQuoteSchema.parse(data)

  const study = await prisma.study.upsert({
    where: { number: validated.studyNumber },
    update: {},
    create: {
      number: validated.studyNumber,
      name: `Etude ${validated.studyNumber}`,
    },
  })

  const productTypeExists = await prisma.productType.findUnique({
    where: { id: validated.productTypeId },
    select: { id: true },
  })
  if (!productTypeExists) {
    throw new Error('Le type de PLV sélectionné n\'existe plus.')
  }

  const reference = await generateReference(validated.parentReference)
  const { transportDeliveries } = validated

  const quote = await prisma.quote.create({
    data: {
      ...buildQuoteData(validated, {
        reference,
        studyId: study.id,
        userId: session.user.id,
      }),
      accessories: {
        create: validated.accessories?.map((acc) => ({
          accessoryId: acc.id,
          quantity: acc.quantity,
        })),
      },
      consumables: {
        create: validated.consumables?.map((c) => ({
          consumableId: c.id,
          sizePerItem: c.sizePerItem,
        })),
      },
      elements: {
        create: validated.elements.map((el) => ({
          name: el.name,
          quantity: el.quantity,
        })),
      },
      transportDeliveries: transportDeliveries && transportDeliveries.length > 0 ? {
        create: transportDeliveries.map((d) => ({
          transportMode: d.transportMode,
          department: d.department,
          weightKg: d.weightKg ?? null,
          units: d.units,
          optionsHT: d.optionsHT,
          basePriceHT: d.basePriceHT,
          totalHT: d.totalHT,
        })),
      } : undefined,
      products: validated.products && validated.products.length > 0 ? {
        create: validated.products.map((p) => ({
          position: p.position,
          productTypeId: p.productTypeId ?? null,
          productTypeName: p.productTypeName ?? null,
          flatWidth: p.flatWidth,
          flatHeight: p.flatHeight,
          quantity: p.quantity,
          plateId: p.plateId ?? null,
          itemsPerPlate: p.itemsPerPlate ?? null,
          platesCount: p.platesCount ?? null,
          printMode: p.printMode ?? 'production',
          isRectoVerso: p.isRectoVerso ?? false,
          rectoVersoType: p.rectoVersoType ?? null,
          inkMlPerPlate: p.inkMlPerPlate ?? 0,
          varnishSurfacePercent: p.varnishSurfacePercent ?? 0,
          flatColorSurfacePercent: p.flatColorSurfacePercent ?? 0,
          hasVarnish: p.hasVarnish ?? false,
          hasFlatColor: p.hasFlatColor ?? false,
          hasImpression: p.hasImpression ?? true,
          printSetupType: p.printSetupType ?? 'none',
          cuttingTimePerPoseSeconds: p.cuttingTimePerPoseSeconds ?? 0,
          cuttingSetupType: p.cuttingSetupType ?? 'none',
          totalCost: p.totalCost ?? null,
        })),
      } : undefined,
      productionSheet: {
        create: { status: 'en_attente' },
      },
    },
  })

  await logAction({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email,
    action: 'CREATE_QUOTE',
    entityType: 'Quote',
    entityRef: reference,
    details: { studyNumber: validated.studyNumber, productTypeId: validated.productTypeId, quantity: validated.quantity },
  })

  revalidateCache('quotes')
  return quote
}

export async function updateQuote(id: number, data: CreateQuoteInput) {
  const session = await requireAuth()
  const validated = createQuoteSchema.parse(data)

  const existing = await prisma.quote.findUnique({ where: { id }, select: { userId: true, reference: true } })
  if (!existing) throw new Error('Devis introuvable')
  if (session.user.role !== 'ADMIN' && existing.userId !== session.user.id) throw new Error('Non autorisé')

  const study = await prisma.study.upsert({
    where: { number: validated.studyNumber },
    update: {},
    create: { number: validated.studyNumber, name: `Etude ${validated.studyNumber}` },
  })

  const { transportDeliveries } = validated

  await prisma.$transaction([
    prisma.quoteAccessory.deleteMany({ where: { quoteId: id } }),
    prisma.quoteConsumable.deleteMany({ where: { quoteId: id } }),
    prisma.quoteElement.deleteMany({ where: { quoteId: id } }),
    prisma.quoteTransportDelivery.deleteMany({ where: { quoteId: id } }),
    prisma.quoteProduct.deleteMany({ where: { quoteId: id } }),
    prisma.quote.update({
      where: { id },
      data: {
        ...buildQuoteData(validated, { reference: existing.reference!, studyId: study.id, userId: existing.userId! }),
        accessories: { create: validated.accessories?.map((acc) => ({ accessoryId: acc.id, quantity: acc.quantity })) },
        consumables: { create: validated.consumables?.map((c) => ({ consumableId: c.id, sizePerItem: c.sizePerItem })) },
        elements: { create: validated.elements.map((el) => ({ name: el.name, quantity: el.quantity })) },
        transportDeliveries: transportDeliveries?.length ? {
          create: transportDeliveries.map((d) => ({
            transportMode: d.transportMode, department: d.department, weightKg: d.weightKg ?? null,
            units: d.units, optionsHT: d.optionsHT, basePriceHT: d.basePriceHT, totalHT: d.totalHT,
          })),
        } : undefined,
        products: validated.products?.length ? {
          create: validated.products.map((p) => ({
            position: p.position, productTypeId: p.productTypeId ?? null, productTypeName: p.productTypeName ?? null,
            flatWidth: p.flatWidth, flatHeight: p.flatHeight, quantity: p.quantity, plateId: p.plateId ?? null,
            itemsPerPlate: p.itemsPerPlate ?? null, platesCount: p.platesCount ?? null,
            printMode: p.printMode ?? 'production', isRectoVerso: p.isRectoVerso ?? false,
            rectoVersoType: p.rectoVersoType ?? null, inkMlPerPlate: p.inkMlPerPlate ?? 0,
            varnishSurfacePercent: p.varnishSurfacePercent ?? 0, flatColorSurfacePercent: p.flatColorSurfacePercent ?? 0,
            hasVarnish: p.hasVarnish ?? false, hasFlatColor: p.hasFlatColor ?? false,
            hasImpression: p.hasImpression ?? true, printSetupType: p.printSetupType ?? 'none',
            cuttingTimePerPoseSeconds: p.cuttingTimePerPoseSeconds ?? 0, cuttingSetupType: p.cuttingSetupType ?? 'none',
            totalCost: p.totalCost ?? null,
          })),
        } : undefined,
      },
    }),
  ])

  revalidateCache('quotes')
  revalidatePath(`/dashboard/my-quotes`)
}

export async function getUserQuotes() {
  const session = await requireAuth()
  return await prisma.quote.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { productionSheet: { status: 'en_cours' } },
      ],
    },
    include: {
      study: true,
      productType: true,
      plate: true,
      productionSheet: { select: { status: true, updatedAt: true } },
      actuals: { select: { id: true, updatedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function sendQuoteToUser(quoteId: number, targetUserId: string) {
  const session = await requireAuth()

  const source = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      accessories: true,
      consumables: true,
      elements: true,
      products: true,
      transportDeliveries: true,
    },
  })

  if (!source) throw new Error('Devis introuvable')
  if (session.user.role !== 'ADMIN' && source.userId !== session.user.id) {
    throw new Error('Non autorisé')
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })
  if (!targetUser) throw new Error('Utilisateur destinataire introuvable')

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    reference: _reference,
    userId: _userId,
    sentByUserId: _sentByUserId,
    sentByUserName: _sentByUserName,
    accessories: srcAccessories,
    consumables: srcConsumables,
    elements: srcElements,
    products: srcProducts,
    transportDeliveries: srcTransports,
    ...scalarFields
  } = source

  const reference = await generateReference()

  await prisma.quote.create({
    data: {
      ...scalarFields,
      reference,
      parentReference: null,
      userId: targetUserId,
      sentByUserId: session.user.id,
      sentByUserName: session.user.name ?? session.user.email,
      accessories: {
        create: srcAccessories.map((a) => ({ accessoryId: a.accessoryId, quantity: a.quantity })),
      },
      consumables: {
        create: srcConsumables.map((c) => ({ consumableId: c.consumableId, sizePerItem: c.sizePerItem })),
      },
      elements: {
        create: srcElements.map((e) => ({ name: e.name, quantity: e.quantity })),
      },
      products: srcProducts.length > 0 ? {
        create: srcProducts.map(({ id: _pId, quoteId: _qId, ...p }) => p),
      } : undefined,
      transportDeliveries: srcTransports.length > 0 ? {
        create: srcTransports.map(({ id: _tId, quoteId: _qId, ...t }) => t),
      } : undefined,
      productionSheet: {
        create: { status: 'en_attente' },
      },
    },
  })

  revalidateCache('quotes')
  revalidatePath('/dashboard/my-quotes')
}

export async function deleteQuote(id: number) {
  const session = await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const whereClause = session.user.role === 'ADMIN'
    ? { id: validId }
    : { id: validId, userId: session.user.id }

  const quote = await prisma.quote.findUnique({ where: { id: validId }, select: { reference: true } })
  await prisma.quote.delete({ where: whereClause })

  await logAction({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email,
    action: 'DELETE_QUOTE',
    entityType: 'Quote',
    entityRef: quote?.reference ?? String(validId),
  })

  revalidateCache('quotes')
  revalidatePath('/dashboard/my-quotes')
}

export async function getQuoteById(id: number) {
  const session = await requireAuth()
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      study: true,
      productType: { include: { elements: true } },
      plate: true,
      accessories: { include: { accessory: true } },
      consumables: { include: { consumable: true } },
      elements: true,
      products: {
        include: { plate: true },
        orderBy: { position: 'asc' },
      },
      transportDeliveries: true,
      productionSheet: { select: { status: true } },
    },
  })
  if (!quote) return null
  const canAccess =
    session.user.role === 'ADMIN' ||
    quote.userId === session.user.id ||
    quote.productionSheet?.status === 'en_cours'
  if (!canAccess) throw new Error('Non autorisé')
  return quote
}

export async function getQuoteDetail(id: number) {
  const session = await requireAuth()

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      study: true,
      productType: { include: { elements: true } },
      plate: true,
      packagingPlate: true,
      accessories: { include: { accessory: true } },
      products: { include: { plate: true } },
      transportDeliveries: true,
      actuals: true,
      productionSheet: true,
    },
  })

  if (!quote) return null
  const canAccess =
    session.user.role === 'ADMIN' ||
    quote.userId === session.user.id ||
    quote.productionSheet?.status === 'en_cours'
  if (!canAccess) throw new Error('Non autorisé')

  return quote
}
