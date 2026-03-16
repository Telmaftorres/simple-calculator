import { auth } from '@/auth'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')
  return session
}

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')
  if (session.user.role !== 'ADMIN') throw new Error('Accès refusé')
  return session
}