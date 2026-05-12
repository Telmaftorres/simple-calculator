'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDFA } from './variants/LayoutA'
import { ProductionSheetPDFB } from './variants/LayoutB'
import { ProductionSheetPDFC } from './variants/LayoutC'
import { SAMPLE_QUOTE, SAMPLE_PS } from './sample-data'

function PreviewButton({ label, description, onGenerate }: {
  label: string
  description: string
  onGenerate: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const handle = async () => { setLoading(true); await onGenerate(); setLoading(false) }
  return (
    <div className="border rounded-xl p-6 space-y-3 bg-white shadow-sm">
      <h2 className="text-lg font-bold">{label}</h2>
      <p className="text-sm text-slate-500">{description}</p>
      <button
        onClick={handle}
        disabled={loading}
        className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? 'Génération…' : 'Ouvrir le PDF'}
      </button>
    </div>
  )
}

export function PreviewClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const open = async (component: any) => {
    const blob = await pdf(component).toBlob()
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 space-y-6">
      <h1 className="text-2xl font-bold">Prévisualisations — Fiche de production PDF</h1>
      <PreviewButton
        label="Option A — Bon de travail"
        description="Layout sobre, sections en blocs noirs et blancs. Style formulaire industriel, idéal impression N&B."
        onGenerate={() => open(<ProductionSheetPDFA quote={SAMPLE_QUOTE} productionSheet={SAMPLE_PS} />)}
      />
      <PreviewButton
        label="Option B — Dashboard couleurs"
        description="Header sombre, nomenclature centrale, infos opérations en colonnes colorées par type."
        onGenerate={() => open(<ProductionSheetPDFB quote={SAMPLE_QUOTE} productionSheet={SAMPLE_PS} />)}
      />
      <PreviewButton
        label="Option C — Portrait 2 colonnes"
        description="Format portrait A4, colonne gauche détails, colonne droite chiffres clés. Compact, tout en 1 page."
        onGenerate={() => open(<ProductionSheetPDFC quote={SAMPLE_QUOTE} productionSheet={SAMPLE_PS} />)}
      />
    </div>
  )
}
