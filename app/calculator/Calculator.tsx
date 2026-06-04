'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calculator as CalcIcon, Settings } from 'lucide-react'
import Link from 'next/link'
import type { CalculatorProps } from '@/types/calculator'
import { useCalculator } from '@/hooks/useCalculator'
import { CalculatorContext, useCalculatorContext } from './context/CalculatorContext'
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
import { VoirDevisButton } from './sections/VoirDevisButton'
import { SectionDisplay } from './shared'
import { SectionMultiProduct } from './sections/SectionMultiProduct'
import { SectionProductionExtra } from './sections/SectionProductionExtra'
import { SectionActualsExtra } from './sections/SectionActualsExtra'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import type { ImpositionResult } from '@/types/calculator'


function ImpositionDisplay({
  impositionResult,
  orientationOverride,
  onOrientationChange,
  bordABord,
  onBordABordChange,
  itemsPerPlateOverride,
  onItemsPerPlateOverrideChange,
}: {
  impositionResult: ImpositionResult
  orientationOverride: 'normal' | 'rotated' | null
  onOrientationChange: (v: 'normal' | 'rotated' | null) => void
  bordABord: boolean
  onBordABordChange: (v: boolean) => void
  itemsPerPlateOverride: number | null
  onItemsPerPlateOverrideChange: (v: number | null) => void
}) {
  const [open, setOpen] = useState(false)

  const ORIENTATION_LABELS = { normal: 'Horizontal', rotated: 'Vertical', mixed: 'Mix' }
  const isOverridden = orientationOverride !== null
  const displayLabel = isOverridden
    ? (orientationOverride === 'normal' ? 'Horizontal ✎' : 'Vertical ✎')
    : ORIENTATION_LABELS[impositionResult.orientation]

  return (
    <div className="space-y-2">
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
      <div className="flex gap-2">
        <button
          onClick={() => onBordABordChange(!bordABord)}
          className={`flex-1 flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium border transition-all ${
            bordABord
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          <span>Bord à bord</span>
          <span className={`text-xs font-normal ${bordABord ? 'text-blue-200' : 'text-slate-400'}`}>
            {bordABord ? '0 mm' : 'std'}
          </span>
        </button>
        <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2 bg-white">
          <span className="text-xs text-slate-400 whitespace-nowrap">Poses/plaque</span>
          <input
            type="number"
            min={1}
            placeholder="auto"
            value={itemsPerPlateOverride ?? ''}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              onItemsPerPlateOverrideChange(isNaN(v) || v <= 0 ? null : v)
            }}
            className="w-14 text-sm font-semibold text-blue-700 text-right bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  )
}

function StudyPrefill({ studyId }: { studyId: string }) {
  const { setStudyNumber, setField } = useCalculatorContext()
  useEffect(() => {
    import('@/app/actions/crm-config').then(({ getStudyFromCrm }) => {
      getStudyFromCrm(studyId).then((data) => {
        if (!data) return
        setStudyNumber(data.studyNumber)
        setField('client', data.clientName)
      })
    })
  }, [studyId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
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
  packagingRules,
  mode = 'quote',
  targetQuoteId,
  productionSheetExtra,
  initialStudyId,
}: CalculatorProps) {
  const calc = useCalculator(
    initialProductTypes,
    plates,
    accessories,
    consumables,
    initialQuote,
    isViewOnly,
    settings,
    packagingRules,
    mode,
    targetQuoteId,
    productionSheetExtra,
  )

  if (calc.screenState === 'success') return <ScreenSuccess />

  return (
    <CalculatorContext.Provider value={{
      ...calc,
      plates,
      accessories,
      consumables,
    }}>
      {initialStudyId && <StudyPrefill studyId={initialStudyId} />}
      {calc.screenState === 'recap' ? (
        <ScreenRecap />
      ) : (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
          {/* Header */}
          <div className={`flex justify-between items-center p-6 rounded-lg shadow-lg ${
            mode === 'production' ? 'bg-emerald-900' : mode === 'actuals' ? 'bg-sky-900' : 'bg-slate-900'
          } text-white`}>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalcIcon className={`h-6 w-6 ${mode === 'production' ? 'text-emerald-300' : mode === 'actuals' ? 'text-sky-300' : 'text-emerald-400'}`} />
                {mode === 'production' && 'Fiche de production'}
                {mode === 'actuals' && 'Données réelles'}
                {mode === 'quote' && 'Calculateur Kontfeel'}
              </h1>
              {mode !== 'quote' && initialQuote?.reference && (
                <p className="text-sm text-slate-300 mt-0.5">Devis {initialQuote.reference} — {initialQuote.client ?? ''}</p>
              )}
            </div>
            <div className="flex gap-2">
              {(mode === 'production' || mode === 'actuals') && (
                <VoirDevisButton />
              )}
              {mode !== 'quote' && targetQuoteId && (
                <Link href={`/dashboard/my-quotes/${targetQuoteId}`}>
                  <Button variant="outline" className="text-slate-900 border-white hover:bg-slate-200">
                    ← Retour au devis
                  </Button>
                </Link>
              )}
              {isAdmin && mode === 'quote' && (
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              {mode === 'quote' && (
                <Link href="/dashboard" target="_blank">
                  <Button variant="outline" className="text-slate-900 border-white hover:bg-slate-200">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-8 ${mode === 'quote' ? 'lg:grid-cols-3' : ''}`}>
            <div className={`space-y-8 ${mode === 'quote' ? 'lg:col-span-2' : ''}`}>
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
                        bordABord={calc.formState.bordABord}
                        onBordABordChange={calc.setBordABord}
                        itemsPerPlateOverride={calc.formState.itemsPerPlateOverride}
                        onItemsPerPlateOverrideChange={calc.setItemsPerPlateOverride}
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

              {/* ── Sections spécifiques au mode fiche de production ── */}
              {mode === 'production' && <SectionProductionExtra />}

              {/* ── Notes données réelles ── */}
              {mode === 'actuals' && <SectionActualsExtra />}

              {/* ── Bouton sauvegarde en mode prod/actuals ── */}
              {(mode === 'production' || mode === 'actuals') && (
                <div className="sticky bottom-4 z-10">
                  <button
                    onClick={mode === 'production' ? calc.handleSaveProd : calc.handleSaveActuals}
                    disabled={calc.isServing}
                    className={`w-full py-4 text-white font-bold text-base rounded-xl shadow-lg transition-all ${
                      mode === 'production'
                        ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                        : 'bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400'
                    }`}
                  >
                    {calc.isServing
                      ? 'Sauvegarde…'
                      : mode === 'production'
                        ? '✓ Sauvegarder la fiche de production'
                        : '✓ Sauvegarder les données réelles'}
                  </button>
                </div>
              )}
              </ErrorBoundary>
            </div>

            {mode === 'quote' && <RecapSidebar />}
          </div>
        </div>
      )}
    </CalculatorContext.Provider>
  )
}
