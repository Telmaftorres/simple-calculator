'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { unstable_cache } from 'next/cache'

// ✅ Cache créé UNE FOIS hors de la fonction, pas à chaque appel
const getAdminStats = unstable_cache(
  async () => {
    const [totalQuotes, totalRevenue, platesCount] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.aggregate({ _sum: { totalCost: true } }),
      prisma.plate.count(),
    ])
    return {
      totalQuotes,
      totalRevenue: totalRevenue._sum.totalCost || 0,
      platesCount,
    }
  },
  ['dashboard-stats-admin'],
  { tags: ['dashboard-stats', 'quotes'], revalidate: 60 }
)

const getUserStats = (userId: string) => unstable_cache(
  async () => {
    const [totalQuotes, totalRevenue, platesCount] = await Promise.all([
      prisma.quote.count({ where: { userId } }),
      prisma.quote.aggregate({ where: { userId }, _sum: { totalCost: true } }),
      prisma.plate.count(),
    ])
    return {
      totalQuotes,
      totalRevenue: totalRevenue._sum.totalCost || 0,
      platesCount,
    }
  },
  [`dashboard-stats-${userId}`],
  { tags: ['dashboard-stats', 'quotes'], revalidate: 60 }
)

export async function getDashboardStats() {
  const session = await requireAuth()
  const isAdmin = session.user.role === 'ADMIN'

  if (isAdmin) {
    return await getAdminStats()
  }

  return await getUserStats(session.user.id)()
}
