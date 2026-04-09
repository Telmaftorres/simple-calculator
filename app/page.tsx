import { auth } from '@/auth'
import Calculator from './calculator/Calculator'
import { getProductTypes, getPlates } from './actions/reference-data'
import { getQuoteById } from './actions/quotes'
import { getAccessories } from './actions/accessories'
import { getConsumables } from './actions/consumables'
import { getSettingsMap } from './actions/settings'
import { version } from '@/package.json'
import { ModeToggle } from '@/components/layout/ModeToggle'

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Création de Devis',
  description: 'Créez vos devis de PLV rapidement et efficacement.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ editId?: string; viewId?: string }>
}) {
  const { editId, viewId } = await searchParams
  const idToFetch = editId || viewId
  const isViewOnly = !!viewId

  const session = await auth()
  const userName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'Inconnu'

  const [productTypes, plates, accessories, consumables, initialQuote, settings] = await Promise.all([
    getProductTypes(),
    getPlates(),
    getAccessories(),
    getConsumables(),
    idToFetch && !isNaN(parseInt(idToFetch)) ? getQuoteById(parseInt(idToFetch)) : Promise.resolve(null),
    getSettingsMap(),
  ])

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Coucou {userName} !</h1>
            <p className="text-slate-500 dark:text-slate-400">Outil de chiffrage PLV</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
              <ModeToggle />
            </div>
            <div className="text-sm text-slate-400">v{version}</div>
          </div>
        </header>

        <section>
          <Calculator
            productTypes={productTypes}
            plates={plates}
            accessories={accessories}
            consumables={consumables}
            isAdmin={session?.user?.role === 'ADMIN'}
            initialQuote={initialQuote || undefined}
            isViewOnly={isViewOnly}
            settings={settings}
          />
        </section>
      </div>
    </main>
  )
}
