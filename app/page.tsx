import { auth } from '@/auth'
import Calculator from './calculator/Calculator'
import { getProductTypes, getPlates, getQuoteById } from './actions/get-data'
import { getAccessories } from './actions/accessories'
import { getConsumables } from './actions/consumables'

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

  const [productTypes, plates, accessories, consumables, initialQuote] = await Promise.all([
    getProductTypes(),
    getPlates(),
    getAccessories(),
    getConsumables(),
    idToFetch ? getQuoteById(parseInt(idToFetch)) : Promise.resolve(null),
  ])

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coucou {userName} !</h1>
            <p className="text-slate-500">Outil de chiffrage PLV</p>
          </div>
          <div className="text-sm text-right text-slate-400">v1.0.1</div>
        </header>

        <section>
          <Calculator
            productTypes={productTypes}
            plates={plates}
            accessories={accessories}
            consumables={consumables}
            isAdmin={session?.user?.role === 'admin'}
            initialQuote={initialQuote || undefined}
            isViewOnly={isViewOnly}
          />
        </section>
      </div>
    </main>
  )
}
