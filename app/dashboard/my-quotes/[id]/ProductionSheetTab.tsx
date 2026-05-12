'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, ChevronDown, ChevronRight, Package } from 'lucide-react'
import { toast } from 'sonner'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDF } from '@/components/pdf/ProductionSheetPDF'
import { STATUS_OPTIONS, type Quote } from './quote-detail-shared'

// ── Composant section accordéon ──
function Section({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ElementType
  title: string
  badge?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-800 text-sm">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{badge}</span>
          )}
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-400" />
          : <ChevronRight className="h-4 w-4 text-slate-400" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Champ de saisie simple ──
function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  suffix,
  readOnly,
}: {
  label: string
  type?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  suffix?: string
  readOnly?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder ?? '—'}
          readOnly={readOnly}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${readOnly ? 'text-slate-400 bg-slate-50 cursor-default' : ''}`}
        />
        {suffix && <span className="text-xs text-slate-400 shrink-0">{suffix}</span>}
      </div>
    </div>
  )
}

// ── Section Emballage ──
function EmballageSection({ quote, ps, onSave }: {
  quote: Quote
  ps: NonNullable<Quote['productionSheet']>
  onSave: (data: Partial<ProductionSheetInput>) => Promise<void>
}) {
  const mat = quote.packagingMaterialType ?? ''
  const isExternal = mat === 'B' || mat === 'EB'

  const boxTypeLabel =
    quote.packagingBoxType === 'etui' ? 'Étui'
    : quote.packagingBoxType === 'caisse' ? 'Caisse'
    : quote.packagingBoxType === 'plaque_rainee' ? 'Plaque rainée'
    : quote.packagingBoxType ?? '—'

  const matLabel = isExternal
    ? `${mat}${quote.packagingExternalSize ? ` — ${quote.packagingExternalSize}` : ''} (fournisseur externe)`
    : mat || '—'

  const [length, setLength] = useState(ps.packagingBoxLengthMm?.toString() ?? '')
  const [width, setWidth] = useState(ps.packagingBoxWidthMm?.toString() ?? '')
  const [height, setHeight] = useState(ps.packagingBoxHeightMm?.toString() ?? '')
  const [ref, setRef] = useState(ps.packagingSupplierRef ?? '')
  const [notes, setNotes] = useState(ps.packagingNotes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      packagingBoxLengthMm: length ? parseInt(length) : null,
      packagingBoxWidthMm:  width  ? parseInt(width)  : null,
      packagingBoxHeightMm: height ? parseInt(height) : null,
      packagingSupplierRef: ref || null,
      packagingNotes: notes || null,
    })
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Infos du devis (lecture seule) */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type d'emballage" value={boxTypeLabel} readOnly />
        <Field label="Matière" value={matLabel} readOnly />
        {quote.packagingQuantity != null && (
          <Field label="Quantité" value={`${quote.packagingQuantity} pce(s)`} readOnly />
        )}
      </div>

      {/* Champs production spécifiques */}
      {isExternal && (
        <>
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dimensions réelles de l&apos;étui</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Longueur" type="number" value={length} onChange={setLength} placeholder="ex: 350" suffix="mm" />
              <Field label="Largeur"  type="number" value={width}  onChange={setWidth}  placeholder="ex: 150" suffix="mm" />
              <Field label="Hauteur"  type="number" value={height} onChange={setHeight} placeholder="ex: 200" suffix="mm" />
            </div>
          </div>
          <Field label="Référence fournisseur" value={ref} onChange={setRef} placeholder="ex: REF-2024-001" />
        </>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes emballage</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Informations complémentaires sur l'emballage…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
        />
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
        {saving ? 'Sauvegarde…' : 'Enregistrer'}
      </Button>
    </div>
  )
}

// ── Composant principal ──
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

  const handleSaveSection = async (data: Partial<ProductionSheetInput>) => {
    try {
      await upsertProductionSheet(quote.id, data)
      toast.success('Enregistré')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
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
        packagingBoxLengthMm: ps?.packagingBoxLengthMm ?? null,
        packagingBoxWidthMm:  ps?.packagingBoxWidthMm  ?? null,
        packagingBoxHeightMm: ps?.packagingBoxHeightMm ?? null,
        packagingSupplierRef: ps?.packagingSupplierRef ?? null,
        packagingNotes:       ps?.packagingNotes       ?? null,
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
    <div className="space-y-3">

      {/* Statut + PDF */}
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

      {/* Sections accordéon */}
      {quote.hasPackaging && (
        <Section icon={Package} title="Emballage" badge={quote.packagingBoxType ?? undefined}>
          {ps ? (
            <EmballageSection quote={quote} ps={ps} onSave={handleSaveSection} />
          ) : (
            <p className="text-sm text-slate-400 italic">
              Sauvegardez d&apos;abord la fiche de production via le calculateur pour activer cette section.
            </p>
          )}
        </Section>
      )}

    </div>
  )
}
