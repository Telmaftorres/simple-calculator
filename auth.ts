import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw new Error('Failed to fetch user.')
  }
}

import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(3) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await getUser(email)
          if (!user) return null
          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) {
             // Return only simple fields to avoid serialization issues
             return {
                id: user.id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                role: user.role,
                permissions: user.permissions,
                mustChangePassword: user.mustChangePassword,
             } as any
          }
        }

        console.log('Invalid credentials')
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
})
