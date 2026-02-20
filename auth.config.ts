import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith('/login')
      const isOnChangePassword = nextUrl.pathname.startsWith('/change-password')
      const isOnSettings = nextUrl.pathname.startsWith('/settings')
      const mustChangePassword = auth?.user?.mustChangePassword
      const role = auth?.user?.role

      // Page de login — rediriger si déjà connecté
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }

      // Forcer le changement de mot de passe à la première connexion
      if (isLoggedIn) {
        if (mustChangePassword && !isOnChangePassword) {
          return Response.redirect(new URL('/change-password', nextUrl))
        }
        if (!mustChangePassword && isOnChangePassword) {
          return Response.redirect(new URL('/', nextUrl))
        }
      }

      // Paramètres — admin uniquement
      if (isOnSettings) {
        if (!isLoggedIn) return false
        if (role !== 'ADMIN') return Response.redirect(new URL('/', nextUrl))
        return true
      }

      // Toutes les autres routes — connexion requise
      if (!isLoggedIn) return false

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.mustChangePassword = user.mustChangePassword
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.mustChangePassword = token.mustChangePassword
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.role = token.role
        session.user.permissions = token.permissions
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig