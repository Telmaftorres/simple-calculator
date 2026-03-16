'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { unstable_cache } from 'next/cache'

export async function getDashboardStats() {
  const session = await requireAuth()
  const isAdmin = session.user.role === 'ADMIN'
  const userId = session.user.id

  const getStats = unstable_cache(
    async () => {
      const [totalQuotes, totalRevenue, platesCount] = await Promise.all([
        prisma.quote.count(
          isAdmin ? undefined : { where: { userId } }
        ),
        prisma.quote.aggregate({
          ...(isAdmin ? {} : { where: { userId } }),
          _sum: { totalCost: true },
        }),
        prisma.plate.count(),
      ])

      return {
        totalQuotes,
        totalRevenue: totalRevenue._sum.totalCost || 0,
        platesCount,
      }
    },
    [isAdmin ? 'dashboard-stats-admin' : `dashboard-stats-${userId}`],
    {
      tags: ['dashboard-stats', 'quotes'],
      revalidate: 60,
    }
  )

  return await getStats()
}
