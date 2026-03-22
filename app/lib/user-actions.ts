'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth, signOut as authSignOut } from '@/auth'
import { requireAdmin } from '@/lib/auth-helpers'

export async function getUsers() {
  await requireAdmin()
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      mustChangePassword: true,
      role: true,
      permissions: true,
    },
  })
}

export async function createUser(formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const name = (formData.get('name') as string) || `${firstName} ${lastName}`.trim()
  const role = (formData.get('role') as 'ADMIN' | 'USER') || 'USER'

  if (!email || !password) return { error: 'Email et mot de passe requis' }
  if (password.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères' }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        firstName,
        lastName,
        mustChangePassword: true,
        role,
        permissions: role === 'ADMIN' ? ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'] : [],
      },
    })
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: unknown) {
    if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'P2002') {
      return { error: 'Cet email existe déjà' }
    }
    return { error: 'Erreur lors de la création' }
  }
}

export async function updateUser(formData: FormData) {
  await requireAdmin()

  const userId = formData.get('id') as string
  const email = formData.get('email') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'ADMIN' | 'USER'
  const permissions = formData.getAll('permissions') as string[]

  if (!userId || !email) return { error: 'ID et Email requis' }

  const data: {
    email: string
    firstName: string
    lastName: string
    name: string
    password?: string
    role: 'ADMIN' | 'USER'
    permissions: string[]
  } = {
    email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    role,
    permissions,
  }

  if (password && password.length >= 8) {
    data.password = await bcrypt.hash(password, 10)
  }

  try {
    await prisma.user.update({ where: { id: userId }, data })
    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUser(userId: string) {
  await requireAdmin()

  const session = await auth()
  if (session?.user?.id === userId) {
    return { error: 'Vous ne pouvez pas supprimer votre propre compte' }
  }

  try {
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la suppression' }
  }
}

// ── Changement de mot de passe forcé (premier login) ──
// Pas de vérification de l'ancien mot de passe — c'est voulu
export async function updatePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user || !session.user.email) throw new Error('Non autorisé')

  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  if (newPassword.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashedPassword, mustChangePassword: false },
  })

  await authSignOut({ redirectTo: '/login' })
  return { success: true }
}

// ── Changement de mot de passe volontaire (page profil) ──
// Vérifie l'ancien mot de passe — protection contre session volée
export async function updatePasswordWithVerification(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await auth()
  if (!session?.user || !session.user.email) throw new Error('Non autorisé')

  if (data.newPassword.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères' }
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { error: 'Utilisateur introuvable' }

  const passwordsMatch = await bcrypt.compare(data.currentPassword, user.password)
  if (!passwordsMatch) return { error: 'Mot de passe actuel incorrect' }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10)

  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashedPassword },
  })

  return { success: true }
}