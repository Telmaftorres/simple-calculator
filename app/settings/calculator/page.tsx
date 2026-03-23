import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSettings } from '@/app/actions/settings'
import { SettingsClient } from './settings-client'

export default async function CalculatorSettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const settings = await getSettings()
  console.log('Settings keys:', settings.map(s => s.key))

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres du Calculateur</h1>
        <p className="text-slate-500 mt-1">
          Modifiez les constantes métier utilisées dans les calculs de coûts.
        </p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  )
}