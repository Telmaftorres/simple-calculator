'use server'

import { auth } from '@/auth'

/**
 * Vérifie que l'utilisateur est authentifié.
 * Lève une erreur si la session est absente.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')
  return session
}

/**
 * Vérifie que l'utilisateur est authentifié ET admin.
 * Lève une erreur si la session est absente ou si le rôle n'est pas ADMIN.
 */
export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN') throw new Error('Accès refusé')
  return session
}
