import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSettings } from '@/app/actions/settings'
import { SettingsClient } from './settings-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export default async function CalculatorSettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const settings = await getSettings()

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres du Calculateur</h1>
          <p className="text-slate-500 mt-1">
            Modifiez les constantes métier utilisées dans les calculs de coûts.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          </Link>
        </div>
      </div>
      <SettingsClient settings={settings} />
    </div>
  )
}