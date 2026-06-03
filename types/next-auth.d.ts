import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    mustChangePassword?: boolean
    firstName?: string | null
    lastName?: string | null
    role: 'ADMIN' | 'USER'
    permissions?: string[]
    companyId?: number | null
  }

  interface Session {
    user: {
      id: string
      mustChangePassword?: boolean
      firstName?: string | null
      lastName?: string | null
      role: 'ADMIN' | 'USER'
      permissions?: string[]
      companyId?: number | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string
    mustChangePassword?: boolean
    firstName?: string | null
    lastName?: string | null
    role?: 'ADMIN' | 'USER'
    permissions?: string[]
    companyId?: number | null
  }
}
