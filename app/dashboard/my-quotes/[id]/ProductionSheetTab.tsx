'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDF } from '@/components/pdf/ProductionSheetPDF'
import { InfoCell, SectionCard, STATUS_OPTIONS, CONDITIONNEMENT_OPTIONS, type Quote } from './quote-detail-shared'

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

  const nomenclature = quote.isMultiProduct
    ? quote.products.map(p => ({
        designation: p.productTypeName || '—',
        matiere: p.plate ? `${p.plate.name} — ${p.plate.width}×${p.plate.height}` : '—',
        qte: p.platesCount ?? '—',
      }))
    : quote.plate ? [{
        designation: quote.productType?.name || '—',
        matiere: `${quote.plate.name} — ${quote.plate.width}×${quote.plate.height}`,
        qte: ps?.prodPlatesCount ?? quote.platesCount ?? '—',
      }] : []

  const condLabel = CONDITIONNEMENT_OPTIONS.find(o => o.value === ps?.conditionnementType)?.label

  return (
    <div className="space-y-5">

      {/* Statut + PDF */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
                <Button size="sm" variant="outline" className="gap-1"><Download className="h-4 w-4" /> Télécharger PDF</Button>
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

      {/* Informations générales */}
      <SectionCard title="Informations générales">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <InfoCell label="Étude" value={quote.study?.number} />
          <InfoCell label="Client" value={quote.client} />
          <InfoCell label="Type de PLV" value={quote.productType?.name ?? (quote.isMultiProduct ? 'Multi-produits' : '—')} />
          <InfoCell label="Quantité" value={`${quote.quantity} ex`} />
          {!quote.isMultiProduct && <InfoCell label="Format à plat" value={`${quote.flatWidth}×${quote.flatHeight} mm`} />}
          {!quote.isMultiProduct && quote.itemsPerPlate && <InfoCell label="Poses / plaque" value={`${quote.itemsPerPlate}`} />}
        </div>
      </SectionCard>

      {/* Nomenclature */}
      {nomenclature.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-wide font-semibold text-slate-700">Nomenclature matière</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600">Désignation</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Matière</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Qté plaques</th>
                </tr>
              </thead>
              <tbody>
                {nomenclature.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="p-3">{row.designation}</td>
                    <td className="p-3 text-slate-600">{row.matiere}</td>
                    <td className="p-3 text-right font-medium">{row.qte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Passes d'impression (Amalgame) */}
      {quote.hasAmalgame && quote.amalgameRuns.length > 0 && (
        <Card className="border-violet-100">
          <CardHeader className="pb-2 bg-violet-50 border-b border-violet-100">
            <CardTitle className="text-xs uppercase tracking-wide font-semibold text-violet-800">Passes d&apos;impression (amalgame)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600">Passe</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Matière</th>
                  <th className="text-center p-3 font-semibold text-slate-600">Impression</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Qté plaques</th>
                </tr>
              </thead>
              <tbody>
                {quote.amalgameRuns.map((run, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="p-3 font-medium">{run.name}</td>
                    <td className="p-3 text-slate-600">
                      {run.plate ? `${run.plate.name} — ${run.plate.width}×${run.plate.height}` : 'Chutes / sans plaque'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${run.hasImpression ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                        {run.hasImpression ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {run.platesCount != null ? `${run.platesCount}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Valeurs de production */}
      <SectionCard title="Valeurs de production">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {quote.hasImpression && (
            <>
              <InfoCell label="Recto/Verso" value={quote.isRectoVerso ? `R/V — ${quote.rectoVersoType === 'identical' ? 'Identique' : 'Différent'}` : 'Recto seul'} />
              <InfoCell label="Nb plaques" value={ps?.prodPlatesCount ?? quote.platesCount ?? '—'} />
              <InfoCell label="Encre (ml/plaque)" value={ps?.prodInkMlPerPlate != null ? `${ps.prodInkMlPerPlate} ml` : (quote.inkMlPerPlate != null ? `${quote.inkMlPerPlate} ml` : '—')} />
            </>
          )}
          <InfoCell label="Découpe (sec/pose)" value={ps?.prodCuttingTimePerPoseSeconds != null ? `${ps.prodCuttingTimePerPoseSeconds} s` : (quote.cuttingTimePerPoseSeconds != null ? `${quote.cuttingTimePerPoseSeconds} s` : '—')} />
          {quote.hasFaconnage && <InfoCell label="Façonnage (sec/pce)" value={ps?.prodAssemblyTimePerPieceSeconds != null ? `${ps.prodAssemblyTimePerPieceSeconds} s` : (quote.assemblyTimePerPieceSeconds != null ? `${quote.assemblyTimePerPieceSeconds} s` : '—')} />}
          {quote.hasConditionnement && <InfoCell label="Conditionnement (sec/pce)" value={ps?.prodPackTimePerPieceSeconds != null ? `${ps.prodPackTimePerPieceSeconds} s` : (quote.packTimePerPieceSeconds != null ? `${quote.packTimePerPieceSeconds} s` : '—')} />}
          {ps?.nbCollages != null && <InfoCell label="Nb collages" value={ps.nbCollages} />}
          {ps?.collagePerPLV != null && <InfoCell label="Mt. collage / PLV" value={`${ps.collagePerPLV.toFixed(2)} €`} />}
          {ps?.prodTransportCost != null && <InfoCell label="Transport planifié" value={`${ps.prodTransportCost.toFixed(2)} €`} />}
        </div>
      </SectionCard>

      {/* Conditionnement */}
      {(condLabel || ps?.conditionnementNotes) && (
        <SectionCard title="Conditionnement">
          <div className="space-y-1 text-sm">
            {condLabel && <p className="font-medium text-slate-700">{condLabel}</p>}
            {ps?.conditionnementNotes && <p className="text-slate-500">{ps.conditionnementNotes}</p>}
          </div>
        </SectionCard>
      )}

      {/* Notes */}
      {(ps?.faconnageNotes || ps?.achatsNotes || ps?.prodTransportNotes || ps?.remarques) && (
        <SectionCard title="Notes">
          <div className="space-y-3 text-sm">
            {ps?.faconnageNotes && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Façonnage</p><p className="text-slate-700">{ps.faconnageNotes}</p></div>}
            {ps?.achatsNotes && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Achats</p><p className="text-slate-700">{ps.achatsNotes}</p></div>}
            {ps?.prodTransportNotes && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Transport</p><p className="text-slate-700">{ps.prodTransportNotes}</p></div>}
            {ps?.remarques && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Remarques générales</p><p className="text-slate-700">{ps.remarques}</p></div>}
          </div>
        </SectionCard>
      )}

      {/* Plan technique */}
      {ps?.planImageUrl && (
        <SectionCard title="Plan technique">
          <img src={ps.planImageUrl} alt="Plan technique" className="rounded-md border border-slate-200 max-h-64 w-auto object-contain" />
        </SectionCard>
      )}

      {!ps && (
        <p className="text-sm text-slate-400 italic text-center py-6">Aucune fiche de production enregistrée. Utilisez le bouton ci-dessus pour en créer une.</p>
      )}
    </div>
  )
}
