'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const email = formData.get('email') as string

    // Déterminer la bonne redirection avant le signIn
    const user = await prisma.user.findUnique({
      where: { email },
      select: { mustChangePassword: true },
    })

    const redirectTo = user?.mustChangePassword ? '/change-password' : '/'

    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo })
  } catch (error) {
    console.error('Sign in error:', error)
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'
        default:
          return 'Something went wrong.'
      }
    }
    throw error
  }
}
