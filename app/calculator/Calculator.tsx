'use client'

import { useState } from 'react'
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
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import type { ImpositionResult } from '@/types/calculator'

function ImpositionDisplay({
  impositionResult,
  orientationOverride,
  onOrientationChange,
}: {
  impositionResult: ImpositionResult
  orientationOverride: 'normal' | 'rotated' | null
  onOrientationChange: (v: 'normal' | 'rotated' | null) => void
}) {
  const [open, setOpen] = useState(false)

  const ORIENTATION_LABELS = { normal: 'Horizontal', rotated: 'Vertical', mixed: 'Mix' }
  const isOverridden = orientationOverride !== null
  const displayLabel = isOverridden
    ? (orientationOverride === 'normal' ? 'Horizontal ✎' : 'Vertical ✎')
    : ORIENTATION_LABELS[impositionResult.orientation]

  return (
    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{impositionResult.itemsPerPlate}</div>
        <div className="text-xs text-blue-400 uppercase">Poses / Plaque</div>
      </div>
      <div className="text-center relative">
        <button
          onClick={() => setOpen(!open)}
          className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${
            isOverridden ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' : 'hover:bg-blue-100 text-slate-700'
          }`}
          title="Cliquer pour changer l'orientation"
        >
          {displayLabel}
        </button>
        <div className="text-xs text-slate-400">Orientation</div>
        {open && (
          <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden text-sm min-w-[160px]">
            {isOverridden && (
              <button className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-500 italic border-b border-slate-100"
                onClick={() => { onOrientationChange(null); setOpen(false) }}>
                ↩ Remettre en auto
              </button>
            )}
            {orientationOverride !== 'normal' && (
              <button className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-medium"
                onClick={() => { onOrientationChange('normal'); setOpen(false) }}>
                Forcer Horizontal
              </button>
            )}
            {orientationOverride !== 'rotated' && (
              <button className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-medium"
                onClick={() => { onOrientationChange('rotated'); setOpen(false) }}>
                Forcer Vertical
              </button>
            )}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-700">{impositionResult.platesNeeded}</div>
        <div className="text-xs text-slate-400 uppercase">Plaques Nécessaires</div>
      </div>
    </div>
  )
}

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
              <ErrorBoundary>
              {/* ── Marges internes ── */}
              <div className="flex items-center gap-3 bg-slate-800 text-white px-6 py-3 rounded-lg">
                <span className="text-sm font-medium text-slate-300 mr-2">Marges internes :</span>
                <button
                  onClick={() => calc.setShowMargeCommerciale(!calc.showMargeCommerciale)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    calc.showMargeCommerciale
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-slate-500 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  Com. commerciale 2.5%
                </button>
                <button
                  onClick={() => calc.setShowMargeSopano(!calc.showMargeSopano)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    calc.showMargeSopano
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-slate-500 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  Com. Sopano 5%
                </button>
              </div>

              <SectionPresentation />

              {/* ── Mode multi-produits ── */}
              {calc.isMultiProduct ? (
                <>
                  <SectionBureauEtudes />
                  <SectionMultiProduct />
                </>
              ) : (
                <>
                  {calc.impositionResult && (
                    <SectionDisplay number="2" title="Poses (Imposition)" color="blue">
                      <ImpositionDisplay
                        impositionResult={calc.impositionResult}
                        orientationOverride={calc.orientationOverride}
                        onOrientationChange={calc.setOrientationOverride}
                      />
                    </SectionDisplay>
                  )}
                  <SectionBureauEtudes />
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
              </ErrorBoundary>
            </div>

            <RecapSidebar />
          </div>
        </div>
      )}
    </CalculatorContext.Provider>
  )
}
