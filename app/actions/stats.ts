'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'

export async function getDashboardStats() {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) return { totalQuotes: 0, totalRevenue: 0, platesCount: 0 }

  const isAdmin = session.user.role === 'ADMIN'

  const [totalQuotes, revenueAgg, platesCount] = await Promise.all([
    prisma.quote.count({ where: isAdmin ? { companyId } : { companyId, userId: session.user.id } }),
    prisma.quote.aggregate({ where: isAdmin ? { companyId } : { companyId, userId: session.user.id }, _sum: { totalCost: true } }),
    prisma.plate.count({ where: { companyId } }),
  ])

  return {
    totalQuotes,
    totalRevenue: revenueAgg._sum.totalCost || 0,
    platesCount,
  }
}
