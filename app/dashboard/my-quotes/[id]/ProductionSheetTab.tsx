'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDF } from '@/components/pdf/ProductionSheetPDF'
import { STATUS_OPTIONS, type Quote } from './quote-detail-shared'

export function ProductionSheetTab({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<ProductionSheetInput['status']>(
    (ps?.status as ProductionSheetInput['status']) ?? 'en_attente'
  )
  const [savingStatus, setSavingStatus] = useState(false)

  const handleStatusChange = async (newStatus: ProductionSheetInput['status']) => {
    setStatus(newStatus)
    setSavingStatus(true)
    try {
      await upsertProductionSheet(quote.id, { status: newStatus })
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
      setStatus(status)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const psInput: ProductionSheetInput = {
        prodCuttingTimePerPoseSeconds:   ps?.prodCuttingTimePerPoseSeconds   ?? null,
        prodAssemblyTimePerPieceSeconds: ps?.prodAssemblyTimePerPieceSeconds ?? null,
        prodPackTimePerPieceSeconds:     ps?.prodPackTimePerPieceSeconds     ?? null,
        prodInkMlPerPlate:               ps?.prodInkMlPerPlate               ?? null,
        prodPlatesCount:                 ps?.prodPlatesCount                 ?? null,
        prodTransportCost:               ps?.prodTransportCost               ?? null,
        prodTransportNotes:              ps?.prodTransportNotes              ?? null,
        nbCollages:           ps?.nbCollages           ?? null,
        collagePerPLV:        ps?.collagePerPLV        ?? null,
        faconnageNotes:       ps?.faconnageNotes       ?? null,
        conditionnementType:  ps?.conditionnementType  ?? null,
        conditionnementNotes: ps?.conditionnementNotes ?? null,
        achatsNotes:          ps?.achatsNotes          ?? null,
        remarques:            ps?.remarques            ?? null,
        planImageUrl:         ps?.planImageUrl         ?? null,
        status: (ps?.status as ProductionSheetInput['status']) ?? 'en_attente',
      }
      const blob = await pdf(<ProductionSheetPDF quote={quote} productionSheet={psInput} />).toBlob()
      setPdfUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500">{savingStatus ? 'Sauvegarde…' : 'Statut :'}</span>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value as ProductionSheetInput['status'])}
            disabled={savingStatus}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all border ${
              status === opt.value ? `${opt.color} border-transparent` : 'border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {pdfUrl ? (
          <>
            <a href={pdfUrl} download={`fiche-prod-${quote.study?.number ?? quote.id}.pdf`}>
              <Button size="sm" variant="outline" className="gap-1"><Download className="h-4 w-4" /> Télécharger</Button>
            </a>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1"><FileText className="h-4 w-4" /> Voir PDF</Button>
            </a>
          </>
        ) : (
          <Button size="sm" variant="outline" className="gap-1" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
            <FileText className="h-4 w-4" />
            {isGeneratingPdf ? 'Génération…' : 'Générer PDF'}
          </Button>
        )}
      </div>
    </div>
  )
}
