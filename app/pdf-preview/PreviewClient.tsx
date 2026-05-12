'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDFE } from './variants/LayoutE'
import { SAMPLE_QUOTE, SAMPLE_PS } from './sample-data'

export function PreviewClient() {
  const [loading, setLoading] = useState(false)

  const open = async () => {
    setLoading(true)
    const blob = await pdf(<ProductionSheetPDFE quote={SAMPLE_QUOTE} productionSheet={SAMPLE_PS} />).toBlob()
    window.open(URL.createObjectURL(blob), '_blank')
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">Preview — Fiche de production PDF</h1>
      <button
        onClick={open}
        disabled={loading}
        className="px-5 py-3 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? 'Génération…' : 'Ouvrir le PDF'}
      </button>
    </div>
  )
}
