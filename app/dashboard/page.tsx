import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  Layers,
  Box,
  Component,
  Calculator,
  Users,
  FileText,
  DollarSign,
  Clock,
} from 'lucide-react'
import { getDashboardStats } from '@/app/actions/stats'
import { Metadata } from 'next'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Tableau de bord | Administration',
  description: 'Vue d\'ensemble de l\'activité et gestion du catalogue.',
}

export default async function AdminDashboard() {
  const session = await auth()
  const stats = await getDashboardStats()
  const firstName = session?.user?.firstName || '!'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Coucou {firstName}
        </h2>
        <p className="text-slate-500">
          Heureux de te revoir sur ton tableau de bord.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            <p className="text-xs text-muted-foreground">Depuis le début</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Total estimé</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matières Actives</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.platesCount}</div>
            <p className="text-xs text-muted-foreground">Formats disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Grid */}
      <h3 className="text-xl font-semibold text-slate-800 mt-8 mb-4">Gestion</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/plates">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Matières</CardTitle>
              <Layers className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gérer les formats de plaques, types de papier et coûts d&apos;impression.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/products">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Types de PLV</CardTitle>
              <Box className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurer les modèles de produits et leurs éléments constitutifs.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/accessories">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Accessoires</CardTitle>
              <Component className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajouter ou modifier les accessoires (crochets, chevalets, etc.).
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/formulas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Formules</CardTitle>
              <Calculator className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Éditer les formules de calcul de surface à plat (avancé).
              </p>
            </CardContent>
          </Card>
        </Link>

        {(session?.user as any)?.role === 'ADMIN' && (
          <Link href="/dashboard/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-pink-500 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Utilisateurs</CardTitle>
                <Users className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gérer les accès et les rôles des utilisateurs.
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
