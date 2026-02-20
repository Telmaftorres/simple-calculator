import LoginForm from '@/app/ui/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900 p-4 rounded-xl shadow-lg">
            <Calculator className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Connexion Admin</CardTitle>
            <CardDescription>
              Veuillez vous authentifier pour accéder au calculateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
