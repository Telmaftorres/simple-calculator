'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth, signOut as authSignOut } from '@/auth'
import { requireAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const userRoleSchema = z.enum(['ADMIN', 'USER'])

const createUserSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  role: userRoleSchema.default('USER'),
})

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

  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    role: formData.get('role'),
  }

  const parseResult = createUserSchema.safeParse(rawData)
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message }
  }

  const { email, password, firstName, lastName, role } = parseResult.data
  const name = `${firstName} ${lastName}`.trim()
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

const updateUserSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  email: z.string().email('Format d\'email invalide'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  password: z.string().optional().or(z.literal('')),
  role: userRoleSchema.default('USER'),
  permissions: z.array(z.string()).default([]),
})

export async function updateUser(formData: FormData) {
  await requireAdmin()

  const rawData = {
    id: formData.get('id'),
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    password: formData.get('password'),
    role: formData.get('role'),
    permissions: formData.getAll('permissions'),
  }

  const parseResult = updateUserSchema.safeParse(rawData)
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message }
  }

  const { id, email, firstName, lastName, password, role, permissions } = parseResult.data

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

  if (password && password.length > 0) {
    if (password.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères' }
    data.password = await bcrypt.hash(password, 10)
  }

  try {
    await prisma.user.update({ where: { id }, data })
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