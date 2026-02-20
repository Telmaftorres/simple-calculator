import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/settings/users" className="block group">
          <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-emerald-700">
                <Users className="h-5 w-5" /> Gestion des Utilisateurs
              </CardTitle>
              <CardDescription>
                Ajouter, supprimer et gérer les accès des utilisateurs.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Future settings can go here */}
        <div className="block opacity-50 cursor-not-allowed">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Sécurité Avancée
              </CardTitle>
              <CardDescription>Configuration 2FA et logs (Bientôt disponible).</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
