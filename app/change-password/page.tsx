'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePassword } from '@/app/lib/user-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = { error: '', success: false }

export default function ChangePasswordPage() {
  const [state, formAction] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      const result = await updatePassword(formData)
      if (result?.error) return { error: result.error, success: false }
      // Redirect happens in server action usually, but if we return success:
      if (result?.success) {
        window.location.href = '/' // Force client redirect after success
        return { error: '', success: true }
      }
      return { error: 'Unknown error', success: false }
    },
    initialState
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md border-amber-200 shadow-xl">
        <CardHeader className="bg-amber-50 rounded-t-xl border-b border-amber-100">
          <CardTitle className="text-amber-900">Changement de mot de passe requis</CardTitle>
          <CardDescription className="text-amber-800">
            C&apos;est votre première connexion ou votre mot de passe a été réinitialisé. Veuillez
            choisir un nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
              />
            </div>

            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
      disabled={pending}
    >
      {pending ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
    </Button>
  )
}
