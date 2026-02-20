'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth, signOut as authSignOut } from '@/auth'

export async function getUsers() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

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
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized')

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  // Support both unified name and split names
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const name = (formData.get('name') as string) || `${firstName} ${lastName}`.trim()
  const role = (formData.get('role') as 'ADMIN' | 'USER') || 'USER'

  if (!email || !password) return { error: 'Email and password required' }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        firstName,
        lastName,
        mustChangePassword: true, // Force change on first login
        role,
        permissions: role === 'ADMIN' ? ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'] : [],
      },
    })
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: unknown) {
    if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'P2002') {
      return { error: 'Email already exists' }
    }
    return { error: 'Failed to create user' }
  }
}

export async function updateUser(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized')

  const userId = formData.get('id') as string
  const email = formData.get('email') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'ADMIN' | 'USER'
  const permissions = formData.getAll('permissions') as string[]

  if (!userId || !email) return { error: 'ID and Email required' }

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

  if (password && password.length >= 6) {
    data.password = await bcrypt.hash(password, 10)
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    })
    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { error: 'Failed to update user' }
  }
}

export async function deleteUser(userId: string) {
  console.log('deleteUser called with id:', userId)
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // Prevent deleting self?
  if (session.user.id === userId) {
    return { error: 'Cannot delete yourself' }
  }

  try {
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e) {
    console.error('deleteUser error:', e)
    return { error: 'Failed to delete user' }
  }
}

export async function updatePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user || !session.user.email) throw new Error('Unauthorized')

  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  })

  await authSignOut({ redirectTo: '/login' })
  return { success: true }
}
