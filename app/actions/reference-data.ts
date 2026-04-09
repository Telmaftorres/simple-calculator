'use server'

import { prisma } from '@/lib/server/prisma'
import { unstable_cache } from 'next/cache'

export const getStudies = unstable_cache(
  async () => prisma.study.findMany({ orderBy: { createdAt: 'desc' } }),
  ['studies'],
  { tags: ['studies'] }
)

export const getProductTypes = unstable_cache(
  async () => prisma.productType.findMany({ include: { elements: true }, orderBy: { name: 'asc' } }),
  ['product-types'],
  { tags: ['product-types'] }
)

export const getPlates = unstable_cache(
  async () => prisma.plate.findMany({ orderBy: { name: 'asc' } }),
  ['plates'],
  { tags: ['plates'] }
)
