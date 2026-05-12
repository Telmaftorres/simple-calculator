'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDF } from '@/components/pdf/ProductionSheetPDF'
import { STATUS_OPTIONS, type Quote } from './quote-detail-shared'

// ── Bloc accordéon style "card emoji" ──
function Block({
  emoji,
  title,
  summary,
  children,
}: {
  emoji: string
  title: string
  summary?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-2xl border transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'} bg-white overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Ligne champ éditable ──
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
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder ?? ''}
          readOnly={readOnly}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
            readOnly
              ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-default'
              : 'border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent'
          }`}
        />
        {suffix && <span className="text-xs text-slate-400 shrink-0 w-6">{suffix}</span>}
      </div>
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder ?? ''}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
      />
    </div>
  )
}

// ── Section Emballage ──
function EmballageBlock({ quote, ps, onSave }: {
  quote: Quote
  ps: NonNullable<Quote['productionSheet']>
  onSave: (data: Partial<ProductionSheetInput>) => Promise<void>
}) {
  const isExternal = (quote.packagingMaterialType ?? '') === 'B' || (quote.packagingMaterialType ?? '') === 'EB'

  const boxTypeLabel = (v: string | null) =>
    v === 'etui' ? 'Étui' : v === 'caisse' ? 'Caisse' : v === 'plaque_rainee' ? 'Plaque rainée' : v ?? '—'

  const [boxType, setBoxType] = useState(quote.packagingBoxType ?? '')
  const [mat,     setMat]     = useState(ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '')
  const [qty,     setQty]     = useState((ps.prodPackagingQuantity ?? quote.packagingQuantity ?? '').toString())
  const defaultPrice = (ps.prodPackagingUnitPrice ?? quote.packagingUnitPriceOverride ?? '').toString()
  const [unitPrice,  setUnitPrice]  = useState(defaultPrice)
  const [length, setLength] = useState(ps.packagingBoxLengthMm?.toString() ?? '')
  const [width,  setWidth]  = useState(ps.packagingBoxWidthMm?.toString()  ?? '')
  const [height, setHeight] = useState(ps.packagingBoxHeightMm?.toString() ?? '')
  const [notes,  setNotes]  = useState(ps.packagingNotes ?? '')
  const [saving, setSaving] = useState(false)

  const summary = [
    boxTypeLabel(boxType),
    mat || null,
    qty ? `${qty} pcs` : null,
    unitPrice ? `${parseFloat(unitPrice).toFixed(2)} €/pce` : null,
  ].filter(Boolean).join(' · ')

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      packagingBoxLengthMm:   length    ? parseInt(length)       : null,
      packagingBoxWidthMm:    width     ? parseInt(width)        : null,
      packagingBoxHeightMm:   height    ? parseInt(height)       : null,
      packagingNotes:         notes     || null,
      prodPackagingUnitPrice: unitPrice ? parseFloat(unitPrice)  : null,
      prodPackagingQuantity:  qty       ? parseInt(qty)          : null,
      prodPackagingMaterial:  mat       || null,
    })
    setSaving(false)
  }

  return (
    <Block emoji="📦" title="Emballage" summary={summary}>
      <div className="grid grid-cols-2 gap-3">
        {/* Type boîte */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Type d&apos;emballage</label>
          <select
            value={boxType}
            onChange={e => setBoxType(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            {['etui', 'caisse', 'plaque_rainee'].map(v => (
              <option key={v} value={v}>{boxTypeLabel(v)}</option>
            ))}
          </select>
        </div>

        {/* Matière — éditable */}
        <Field label="Matière" value={mat} onChange={setMat} placeholder="ex: BC, EB…" />

        {/* Quantité */}
        <Field label="Quantité" type="number" value={qty} onChange={setQty}
          placeholder={quote.packagingQuantity?.toString() ?? ''} suffix="pcs" />

        {/* Prix unitaire — pré-rempli depuis le devis */}
        <Field label="Prix unitaire" type="number" value={unitPrice} onChange={setUnitPrice}
          placeholder="0.00" suffix="€" />
      </div>

      {/* Dimensions (fournisseur externe) */}
      {isExternal && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dimensions réelles de l&apos;étui</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Longueur" type="number" value={length} onChange={setLength} placeholder="350" suffix="mm" />
            <Field label="Largeur"  type="number" value={width}  onChange={setWidth}  placeholder="150" suffix="mm" />
            <Field label="Hauteur"  type="number" value={height} onChange={setHeight} placeholder="200" suffix="mm" />
          </div>
        </div>
      )}

      <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Informations complémentaires…" />

      <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
        {saving ? 'Sauvegarde…' : 'Enregistrer'}
      </Button>
    </Block>
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
        packagingBoxLengthMm:  ps?.packagingBoxLengthMm  ?? null,
        packagingBoxWidthMm:   ps?.packagingBoxWidthMm   ?? null,
        packagingBoxHeightMm:  ps?.packagingBoxHeightMm  ?? null,
        packagingSupplierRef:  ps?.packagingSupplierRef  ?? null,
        packagingNotes:        ps?.packagingNotes        ?? null,
        prodPackagingUnitPrice:  ps?.prodPackagingUnitPrice  ?? null,
        prodPackagingQuantity:   ps?.prodPackagingQuantity   ?? null,
        prodPackagingMaterial:   ps?.prodPackagingMaterial   ?? null,
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
                status === opt.value
                  ? `${opt.color} border-transparent`
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
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
                <Button size="sm" variant="outline" className="gap-1">
                  <Download className="h-4 w-4" /> Télécharger
                </Button>
              </a>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1">
                  <FileText className="h-4 w-4" /> Voir PDF
                </Button>
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

      {/* Blocs accordéon */}
      {quote.hasPackaging && (
        ps ? (
          <EmballageBlock quote={quote} ps={ps} onSave={handleSaveSection} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            📦 Sauvegardez d&apos;abord la fiche de production via le calculateur pour activer le bloc Emballage.
          </div>
        )
      )}

    </div>
  )
}
