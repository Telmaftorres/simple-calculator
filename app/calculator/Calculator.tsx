'use client'

import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calculator as CalcIcon, Settings } from 'lucide-react'
import Link from 'next/link'
import type { CalculatorProps } from '@/types/calculator'
import { useCalculator } from '@/hooks/useCalculator'
import { CalculatorContext } from './context/CalculatorContext'
import { ScreenSuccess } from './screens/ScreenSuccess'
import { ScreenRecap } from './screens/ScreenRecap'
import { SectionPresentation } from './sections/SectionPresentation'
import { SectionImpression } from './sections/SectionImpression'
import { SectionDecoupe } from './sections/SectionDecoupe'
import { SectionAccessoires } from './sections/SectionAccessoires'
import { SectionFaconnage } from './sections/SectionFaconnage'
import { SectionConditionnement } from './sections/SectionConditionnement'
import { SectionEmballage } from './sections/SectionEmballage'
import { SectionBureauEtudes } from './sections/SectionBureauEtudes'
import { SectionTransport } from './sections/SectionTransport'
import { RecapSidebar } from './sections/RecapSidebar'
import { SectionDisplay } from './shared'
import { SectionMultiProduct } from './sections/SectionMultiProduct'

export default function Calculator({
  productTypes: initialProductTypes,
  plates,
  accessories = [],
  consumables = [],
  isAdmin = false,
  initialQuote,
  isViewOnly,
  settings,
}: CalculatorProps) {
  const calc = useCalculator(
    initialProductTypes,
    plates,
    accessories,
    consumables,
    initialQuote,
    isViewOnly,
    settings
  )

  if (calc.screenState === 'success') return <ScreenSuccess />

  return (
    <CalculatorContext.Provider value={{
      ...calc,
      plates,
      accessories,
      consumables,
    }}>
      {calc.screenState === 'recap' ? (
        <ScreenRecap />
      ) : (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
          {/* Header */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-lg shadow-lg">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalcIcon className="h-6 w-6 text-emerald-400" />
                Calculateur Kontfeel
              </h1>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline" className="text-slate-900 border-white hover:bg-slate-200">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SectionPresentation />
              <SectionBureauEtudes />

              {/* ── Mode multi-produits ── */}
              {calc.isMultiProduct ? (
                <SectionMultiProduct />
              ) : (
                <>
                  {calc.impositionResult && (
                    <SectionDisplay number="2" title="Poses (Imposition)" color="blue">
                      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{calc.impositionResult.itemsPerPlate}</div>
                          <div className="text-xs text-blue-400 uppercase">Poses / Plaque</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{calc.impositionResult.orientation}</div>
                          <div className="text-xs text-slate-400">Orientation</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-700">{calc.impositionResult.platesNeeded}</div>
                          <div className="text-xs text-slate-400 uppercase">Plaques Nécessaires</div>
                        </div>
                      </div>
                    </SectionDisplay>
                  )}
                  <SectionImpression />
                  <SectionDecoupe />
                </>
              )}

              {/* ── Sections communes ── */}
              <SectionFaconnage />
              <SectionConditionnement />
              <SectionAccessoires />
              <SectionEmballage />
              <SectionTransport />
            </div>

            <RecapSidebar />
          </div>
        </div>
      )}
    </CalculatorContext.Provider>
  )
}
