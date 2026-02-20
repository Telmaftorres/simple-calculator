'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined)

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" name="email" placeholder="admin@kontfeel.fr" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="******"
          required
          minLength={3}
        />
      </div>
      <div className="pt-4">
        <LoginButton />
      </div>
      <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
    </form>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      className="w-full bg-slate-900 hover:bg-slate-800"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? 'Chargement...' : 'Se connecter'}
    </Button>
  )
}
