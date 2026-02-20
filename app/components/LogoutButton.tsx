'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex w-full items-center gap-3 px-4 py-3 rounded-md hover:bg-red-900/20 text-red-400 transition-colors border border-transparent hover:border-red-900/30"
    >
      <LogOut className="h-5 w-5" />
      Se déconnecter
    </button>
  )
}
