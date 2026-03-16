'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function getDashboardStats() {
  const session = await requireAuth()
  const isAdmin = session.user.role === 'ADMIN'

  const [totalQuotes, totalRevenue, platesCount] = await Promise.all([
    prisma.quote.count(
      isAdmin ? undefined : { where: { userId: session.user.id } }
    ),
    prisma.quote.aggregate({
      ...(isAdmin ? {} : { where: { userId: session.user.id } }),
      _sum: { totalCost: true },
    }),
    prisma.plate.count(),
  ])

  return {
    totalQuotes,
    totalRevenue: totalRevenue._sum.totalCost || 0,
    platesCount,
  }
}
