import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authenticate } from '../app/actions/auth'

// ── Mocks ──
vi.mock('../lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
}))

vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string
    constructor(type: string) {
      super(type)
      this.type = type
    }
  },
}))

import { prisma } from '../lib/server/prisma'
import { signIn } from '@/auth'

const mockSignIn = signIn as ReturnType<typeof vi.fn>
const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>

function makeFormData(email: string, password: string): FormData {
  const fd = new FormData()
  fd.append('email', email)
  fd.append('password', password)
  return fd
}

describe('authenticate — flux de connexion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirige vers / pour un utilisateur normal connecté', async () => {
    mockFindUnique.mockResolvedValue({ mustChangePassword: false })
    mockSignIn.mockResolvedValue(undefined)

    await authenticate(undefined, makeFormData('user@kontfeel.fr', 'motdepasse123'))

    expect(mockSignIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ redirectTo: '/' })
    )
  })

  it('redirige vers /change-password pour un premier login', async () => {
    mockFindUnique.mockResolvedValue({ mustChangePassword: true })
    mockSignIn.mockResolvedValue(undefined)

    await authenticate(undefined, makeFormData('nouveau@kontfeel.fr', 'motdepasse123'))

    expect(mockSignIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ redirectTo: '/change-password' })
    )
  })

  it('retourne une erreur si les credentials sont invalides', async () => {
    mockFindUnique.mockResolvedValue({ mustChangePassword: false })

    const { AuthError } = await import('next-auth')
    const error = new AuthError('CredentialsSignin')
    mockSignIn.mockRejectedValue(error)

    const result = await authenticate(undefined, makeFormData('user@kontfeel.fr', 'mauvais'))
    expect(result).toBe('Invalid credentials.')
  })

  it('retourne une erreur générique pour les autres erreurs Auth', async () => {
    mockFindUnique.mockResolvedValue({ mustChangePassword: false })

    const { AuthError } = await import('next-auth')
    const error = new AuthError('OAuthSignin')
    mockSignIn.mockRejectedValue(error)

    const result = await authenticate(undefined, makeFormData('user@kontfeel.fr', 'motdepasse123'))
    expect(result).toBe('Something went wrong.')
  })

  it('redirige vers / si l\'utilisateur n\'existe pas en DB (laisser Auth.js gérer)', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockSignIn.mockResolvedValue(undefined)

    await authenticate(undefined, makeFormData('inconnu@kontfeel.fr', 'motdepasse123'))

    expect(mockSignIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ redirectTo: '/' })
    )
  })
})
