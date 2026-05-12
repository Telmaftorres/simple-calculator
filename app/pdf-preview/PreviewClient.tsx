'use client'

import { useState } from 'react'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { ProductionSheetPDFE } from './variants/LayoutE'
import { SpecProposalsPDF } from './variants/SpecProposals'
import { SAMPLE_QUOTE, SAMPLE_PS } from './sample-data'

export function PreviewClient() {
  const [loading, setLoading] = useState<string | null>(null)

  const open = async (key: string, element: React.ReactElement<DocumentProps>) => {
    setLoading(key)
    const blob = await pdf(element).toBlob()
    window.open(URL.createObjectURL(blob), '_blank')
    setLoading(null)
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-2">Preview — Fiche de production PDF</h1>
      <button
        onClick={() => open('main', <ProductionSheetPDFE quote={SAMPLE_QUOTE} productionSheet={SAMPLE_PS} />)}
        disabled={loading !== null}
        className="px-5 py-3 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {loading === 'main' ? 'Génération…' : 'Ouvrir la fiche de production'}
      </button>
      <button
        onClick={() => open('specs', <SpecProposalsPDF />)}
        disabled={loading !== null}
        className="px-5 py-3 bg-violet-700 text-white text-sm rounded-lg hover:bg-violet-600 disabled:opacity-50"
      >
        {loading === 'specs' ? 'Génération…' : 'Voir les propositions — affichage specs'}
      </button>
    </div>
  )
}
