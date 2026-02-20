import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

/**
 * Extension des types NextAuth pour inclure nos champs personnalisés.
 *
 * NextAuth a ses propres interfaces (User, Session, JWT) avec des champs limités.
 * Pour ajouter nos champs custom, on utilise le "module augmentation" de TypeScript :
 * on ré-ouvre le module "next-auth" et on ajoute nos champs.
 *
 * Sans ce fichier, on devait utiliser @ts-ignore partout.
 */

declare module 'next-auth' {
  interface User extends DefaultUser {
    mustChangePassword?: boolean
    firstName?: string | null
    lastName?: string | null
    role?: string
    permissions?: string[]
  }

  interface Session {
    user: {
      id: string
      mustChangePassword?: boolean
      firstName?: string | null
      lastName?: string | null
      role?: string
      permissions?: string[]
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string
    mustChangePassword?: boolean
    firstName?: string | null
    lastName?: string | null
    role?: string
    permissions?: string[]
  }
}
