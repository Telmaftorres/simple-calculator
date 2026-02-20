'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { unstable_cache } from 'next/cache'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Non autorisé')
  }
}

const getCachedDashboardStats = unstable_cache(
  async () => {
    const [totalQuotes, totalRevenue, platesCount] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.aggregate({
        _sum: {
          totalCost: true,
        },
      }),
      // prisma.quote.count({ where: { status: 'PENDING' } }), // Status not yet implemented
      prisma.plate.count(),
    ])

    return {
      totalQuotes,
      totalRevenue: totalRevenue._sum.totalCost || 0,
      platesCount,
    }
  },
  ['dashboard-stats'],
  { tags: ['dashboard-stats'], revalidate: 60 } // Cache for 60 seconds
)

export async function getDashboardStats() {
  await requireAuth()
  return await getCachedDashboardStats()
}
