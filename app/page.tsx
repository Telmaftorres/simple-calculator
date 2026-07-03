import { auth } from '@/auth'
import Calculator from './calculator/Calculator'
import { getProductTypes, getPlates, getPackagingRules } from './actions/reference-data'
import { getQuoteById, getQuoteByReference } from './actions/quotes'
import { getQuoteWithProductionSheet } from './actions/production-sheet'
import { getAccessories } from './actions/accessories'
import { getConsumables } from './actions/consumables'
import { getSettingsMap } from './actions/settings'
import { version } from '@/package.json'
import { ModeToggle } from '@/components/layout/ModeToggle'
import type { CalculatorMode } from '@/types/calculator'

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Création de Devis',
  description: 'Créez vos devis de PLV rapidement et efficacement.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ editId?: string; viewId?: string; prodId?: string; actualsId?: string; study_id?: string; ET?: string; et?: string; chiffrage_ref?: string }>
}) {
  const { editId, viewId, prodId, actualsId, study_id, ET, et, chiffrage_ref } = await searchParams
  // Le CRM ouvre le calculateur avec ?et= (format Pierre). On accepte aussi ?ET= et ?study_id= par sécurité.
  const studyIdParam = et ?? ET ?? study_id

  // Determine mode
  let mode: CalculatorMode = 'quote'
  let targetQuoteId: number | undefined
  if (prodId && !isNaN(parseInt(prodId))) { mode = 'production'; targetQuoteId = parseInt(prodId) }
  else if (actualsId && !isNaN(parseInt(actualsId))) { mode = 'actuals'; targetQuoteId = parseInt(actualsId) }
  else if (viewId && !isNaN(parseInt(viewId))) { targetQuoteId = parseInt(viewId) }
  else if (editId && !isNaN(parseInt(editId))) { targetQuoteId = parseInt(editId) }

  const idToFetch = editId || viewId || prodId || actualsId
  const isViewOnly = !!viewId

  const session = await auth()
  const userName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'Inconnu'

  const companyId = session?.user?.companyId ?? 0
  const [productTypes, plates, accessories, consumables, settings, packagingRules] = await Promise.all([
    getProductTypes(companyId),
    getPlates(companyId),
    getAccessories(companyId),
    getConsumables(companyId),
    getSettingsMap(companyId),
    getPackagingRules(companyId),
  ])

  // For production/actuals mode, load the quote with its production sheet
  let initialQuote = null
  let productionSheetExtra = null
  if (idToFetch && !isNaN(parseInt(idToFetch))) {
    if (mode === 'production') {
      const quoteWithPS = await getQuoteWithProductionSheet(parseInt(idToFetch))
      initialQuote = quoteWithPS
      if (quoteWithPS?.productionSheet) {
        const ps = quoteWithPS.productionSheet
        // If formDataJson exists, it will be applied via the initialQuote mechanism
        productionSheetExtra = {
          status: ps.status,
          remarques: ps.remarques,
          planImageUrl: ps.planImageUrl,
          nbCollages: ps.nbCollages,
          collagePerPLV: ps.collagePerPLV,
          faconnageNotes: ps.faconnageNotes,
          conditionnementType: ps.conditionnementType,
          conditionnementNotes: ps.conditionnementNotes,
          achatsNotes: ps.achatsNotes,
        }
      }
    } else if (mode === 'actuals') {
      // For actuals, load from production sheet's formDataJson if available, else from quote
      const quoteWithPS = await getQuoteWithProductionSheet(parseInt(idToFetch))
      if (quoteWithPS?.productionSheet?.formDataJson) {
        // Use production sheet snapshot as initial values
        try {
          const snap = JSON.parse(quoteWithPS.productionSheet.formDataJson)
          // Merge snap into the quote object for pre-filling
          initialQuote = { ...quoteWithPS, ...snap }
        } catch {
          initialQuote = quoteWithPS
        }
      } else {
        initialQuote = quoteWithPS
      }
    } else {
      initialQuote = await getQuoteById(parseInt(idToFetch))
    }
  }

  // Chargement depuis le bouton crayon du CRM (?chiffrage_ref=DEV-001)
  if (!initialQuote && chiffrage_ref) {
    initialQuote = await getQuoteByReference(chiffrage_ref)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {mode === 'quote' && (
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
        )}

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
            packagingRules={packagingRules}
            mode={mode}
            targetQuoteId={targetQuoteId}
            productionSheetExtra={productionSheetExtra}
            initialStudyId={studyIdParam}
          />
        </section>
      </div>
    </main>
  )
}
