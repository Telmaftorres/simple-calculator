'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDFE } from '@/app/pdf-preview/variants/LayoutE'
import type { PSForPDF } from '@/app/pdf-preview/variants/LayoutE'
import { STATUS_OPTIONS, type Quote } from './quote-detail-shared'
import { patchQuoteFlags } from '@/app/actions/quotes'
import { AmalgameBlock } from './AmalgameBlock'
import { ProduitsBlock } from './ProduitsBlock'

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

// ── Toggle checkbox ──
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 accent-slate-800 cursor-pointer"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

// ── Section Conditionnement ──
function ConditionnementBlock({ quote, ps, onSave }: {
  quote: Quote
  ps: NonNullable<Quote['productionSheet']>
  onSave: (data: Partial<ProductionSheetInput>) => Promise<void>
}) {
  const [type, setType] = useState(ps.conditionnementType ?? '')
  const [notes, setNotes] = useState(ps.conditionnementNotes ?? '')
  const [packTime, setPackTime] = useState((ps.prodPackTimePerPieceSeconds ?? quote.packTimePerPieceSeconds ?? '').toString())
  const [notice, setNotice] = useState(quote.hasAssemblyNotice)
  const [etiquette, setEtiquette] = useState(quote.hasPoseEtiquette)
  const [saving, setSaving] = useState(false)

  const typeLabel = (v: string) =>
    v === 'kit_unitaire' ? 'Kit unitaire' : v === 'caisse' ? 'Caisse' : v === 'palette' ? 'Palette' : v === 'autre' ? 'Autre' : '—'

  const displayTime = packTime || (quote.packTimePerPieceSeconds ? quote.packTimePerPieceSeconds.toString() : null)
  const summary = [
    displayTime ? `${displayTime}s/pce` : null,
    type ? typeLabel(type) : null,
    notice ? 'Notice' : null,
    etiquette ? 'Étiquette' : null,
  ].filter(Boolean).join(' · ')

  const handleSave = async () => {
    setSaving(true)
    await Promise.all([
      onSave({
        conditionnementType: type || null,
        conditionnementNotes: notes || null,
        prodPackTimePerPieceSeconds: packTime ? parseFloat(packTime) : null,
      }),
      patchQuoteFlags(quote.id, { hasAssemblyNotice: notice, hasPoseEtiquette: etiquette }),
    ])
    setSaving(false)
  }

  return (
    <Block emoji="📦" title="Conditionnement" summary={summary}>
      <div className="space-y-3">
        {/* Temps par pièce */}
        <Field
          label="Temps par pièce"
          type="number"
          value={packTime}
          onChange={setPackTime}
          placeholder={quote.packTimePerPieceSeconds?.toString() ?? '0'}
          suffix="s"
        />

        {/* Checkboxes notice / étiquette */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Options</p>
          <div className="flex flex-col gap-2 pt-0.5">
            <Toggle label="Notice de montage" checked={notice} onChange={setNotice} />
            <Toggle label="Pose étiquette" checked={etiquette} onChange={setEtiquette} />
          </div>
        </div>

        {/* Type de conditionnement */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Type de conditionnement</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="">—</option>
            {[['kit_unitaire', 'Kit unitaire'], ['caisse', 'Caisse'], ['palette', 'Palette'], ['autre', 'Autre']].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Instructions de conditionnement…" />
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </Button>
      </div>
    </Block>
  )
}

// ── Section Emballage ──
function EmballageBlock({ quote, ps, onSave }: {
  quote: Quote
  ps: NonNullable<Quote['productionSheet']>
  onSave: (data: Partial<ProductionSheetInput>) => Promise<void>
}) {
  const boxTypeLabel = (v: string | null) =>
    v === 'etui' ? 'Étui' : v === 'caisse' ? 'Caisse' : v === 'plaque_rainee' ? 'Plaque rainée' : v ?? '—'

  const [boxType, setBoxType] = useState(quote.packagingBoxType ?? '')
  const [mat,     setMat]     = useState(ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '')
  const isExternal = mat === 'B' || mat === 'EB'
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

        {/* Matière — select */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Matière</label>
          <select
            value={mat}
            onChange={e => setMat(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="">—</option>
            {['C', 'BC', 'B', 'EB'].map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

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

type SectionKey = 'produits' | 'amalgame' | 'conditionnement' | 'emballage'

// ── Bouton "Ajouter une section" ──
function AddSectionMenu({ available, onAdd }: { available: { key: SectionKey; label: string; emoji: string }[]; onAdd: (key: SectionKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (available.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:text-slate-800 transition-colors bg-white"
      >
        <span className="text-base leading-none">+</span> Ajouter une section
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
          {available.map(s => (
            <button
              key={s.key}
              onClick={() => { onAdd(s.key); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ──
const EMPTY_PS: NonNullable<Quote['productionSheet']> = {
  id: 0,
  prodCuttingTimePerPoseSeconds: null, prodMachineTimeMinOverride: null,
  prodAssemblyTimePerPieceSeconds: null, prodPackTimePerPieceSeconds: null,
  prodInkMlPerPlate: null, prodPlatesCount: null,
  prodTransportCost: null, prodTransportNotes: null,
  nbCollages: null, collagePerPLV: null, faconnageNotes: null,
  conditionnementType: null, conditionnementNotes: null,
  achatsNotes: null, remarques: null, delaiRealisation: null,
  planImageUrl: null, status: 'en_attente',
  packagingBoxLengthMm: null, packagingBoxWidthMm: null, packagingBoxHeightMm: null,
  packagingSupplierRef: null, packagingNotes: null,
  prodPackagingUnitPrice: null, prodPackagingQuantity: null, prodPackagingMaterial: null,
  productionAmalgameRuns: [],
  productionProductLines: [],
}

export function ProductionSheetTab({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet ?? EMPTY_PS
  const [isDownloading, setIsDownloading] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [status, setStatus] = useState<ProductionSheetInput['status']>(
    (ps?.status as ProductionSheetInput['status']) ?? 'en_attente'
  )
  const [savingStatus, setSavingStatus] = useState(false)

  // Sections ajoutées manuellement (non cochées dans le devis mais avec des données sauvegardées)
  // Produits : toujours visible (tout devis a au moins un produit)
  const psHasProduits = true
  const psHasAmalgame = quote.hasAmalgame || quote.isMultiProduct || ps.productionAmalgameRuns.length > 0
  const psHasConditionnement = quote.productionSheet != null && (
    ps.conditionnementType != null || ps.prodPackTimePerPieceSeconds != null || ps.conditionnementNotes != null
  )
  const psHasEmballage = quote.productionSheet != null && (
    ps.prodPackagingQuantity != null || ps.prodPackagingMaterial != null || ps.packagingBoxLengthMm != null
  )
  const [extraSections, setExtraSections] = useState<Set<SectionKey>>(() => {
    const s = new Set<SectionKey>()
    if (psHasProduits) s.add('produits')
    if (psHasAmalgame) s.add('amalgame')
    if (psHasConditionnement && !quote.hasConditionnement) s.add('conditionnement')
    if (psHasEmballage && !quote.hasPackaging) s.add('emballage')
    return s
  })

  const showProduits = extraSections.has('produits')
  const showAmalgame = extraSections.has('amalgame')
  const showConditionnement = quote.hasConditionnement || extraSections.has('conditionnement')
  const showEmballage = quote.hasPackaging || extraSections.has('emballage')

  const availableSections = [
    !showAmalgame         && { key: 'amalgame'        as SectionKey, label: 'Amalgame',          emoji: '🔀' },
    !showConditionnement  && { key: 'conditionnement' as SectionKey, label: 'Conditionnement',   emoji: '📦' },
    !showEmballage        && { key: 'emballage'       as SectionKey, label: 'Emballage',         emoji: '🗃️' },
  ].filter(Boolean) as { key: SectionKey; label: string; emoji: string }[]

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

  // Si des runs de production ont été sauvegardés, ils remplacent les runs du devis dans le PDF.
  // Pour un devis simple sans amalgame, on crée un run synthétique.
  const buildQuoteForPdf = () => {
    const prodRuns = ps.productionAmalgameRuns
    if (prodRuns.length > 0) {
      return {
        ...quote,
        amalgameRuns: prodRuns.map(r => ({
          name: r.name,
          hasImpression: false,
          platesCount: null,
          cuttingTimePerPoseSeconds: 0,
          machineTimeMinOverride: null,
          isRectoVerso: false,
          rectoVersoType: null,
          plate: null,
          items: r.items.map(it => ({
            name: it.name,
            flatWidth: it.flatWidth,
            flatHeight: it.flatHeight,
            countPerPlate: it.countPerPlate,
            quantityPerUnit: it.quantityPerUnit,
          })),
        })),
        // Efface les produits standalone pour éviter les doublons
        products: [],
      }
    }
    const isSimple = !quote.isMultiProduct && quote.amalgameRuns.length === 0 && quote.products.length === 0
    if (!isSimple) return quote
    return {
      ...quote,
      amalgameRuns: [{
        name: quote.productType?.name ?? 'Produit',
        hasImpression: quote.hasImpression,
        platesCount: quote.platesCount,
        cuttingTimePerPoseSeconds: quote.cuttingTimePerPoseSeconds ?? 0,
        machineTimeMinOverride: ps.prodMachineTimeMinOverride,
        isRectoVerso: quote.isRectoVerso,
        rectoVersoType: quote.rectoVersoType,
        plate: quote.plate ? { name: quote.plate.name, width: quote.plate.width, height: quote.plate.height } : null,
        items: [{
          name: quote.productType?.name ?? 'Produit',
          flatWidth: quote.flatWidth ?? 0,
          flatHeight: quote.flatHeight ?? 0,
          countPerPlate: quote.itemsPerPlate ?? 1,
          quantityPerUnit: 1,
        }],
      }],
    }
  }

  const buildPsForPdf = (): PSForPDF => ({
    prodMachineTimeMinOverride:      ps?.prodMachineTimeMinOverride      ?? null,
    prodAssemblyTimePerPieceSeconds: ps?.prodAssemblyTimePerPieceSeconds ?? null,
    prodPackTimePerPieceSeconds:     ps?.prodPackTimePerPieceSeconds     ?? null,
    nbCollages:           ps?.nbCollages           ?? null,
    collagePerPLV:        ps?.collagePerPLV        ?? null,
    faconnageNotes:       ps?.faconnageNotes       ?? null,
    conditionnementType:  ps?.conditionnementType  ?? null,
    conditionnementNotes: ps?.conditionnementNotes ?? null,
    achatsNotes:          ps?.achatsNotes          ?? null,
    remarques:            ps?.remarques            ?? null,
    delaiRealisation:     ps?.delaiRealisation     ?? null,
    packagingBoxLengthMm:   ps?.packagingBoxLengthMm  ?? null,
    packagingBoxWidthMm:    ps?.packagingBoxWidthMm   ?? null,
    packagingBoxHeightMm:   ps?.packagingBoxHeightMm  ?? null,
    prodPackagingMaterial:  ps?.prodPackagingMaterial ?? null,
    prodPackagingQuantity:  ps?.prodPackagingQuantity ?? null,
  })

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const blob = await pdf(<ProductionSheetPDFE quote={buildQuoteForPdf() as Parameters<typeof ProductionSheetPDFE>[0]['quote']} productionSheet={buildPsForPdf()} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fiche-prod-${quote.study?.number ?? quote.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewPdf = async () => {
    // Ouvrir la fenêtre avant l'await pour éviter le blocage popup du navigateur
    const win = window.open('', '_blank')
    setIsViewing(true)
    try {
      const blob = await pdf(<ProductionSheetPDFE quote={buildQuoteForPdf() as Parameters<typeof ProductionSheetPDFE>[0]['quote']} productionSheet={buildPsForPdf()} />).toBlob()
      const url = URL.createObjectURL(blob)
      if (win) win.location.href = url
    } catch (e) {
      console.error(e)
      win?.close()
      toast.error('Erreur génération PDF')
    } finally {
      setIsViewing(false)
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
          <Button size="sm" variant="outline" className="gap-1" onClick={handleDownloadPdf} disabled={isDownloading || isViewing}>
            <Download className="h-4 w-4" />
            {isDownloading ? 'Génération…' : 'Télécharger'}
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleViewPdf} disabled={isViewing || isDownloading}>
            <FileText className="h-4 w-4" />
            {isViewing ? 'Génération…' : 'Voir PDF'}
          </Button>
        </div>
      </div>

      {/* Bloc Produit(s) */}
      {showProduits && (
        <ProduitsBlock quote={quote} />
      )}

      {/* Bloc Amalgame (pleine largeur) */}
      {showAmalgame && (
        <AmalgameBlock quote={quote} />
      )}

      {/* Blocs accordéon Conditionnement / Emballage */}
      {(showConditionnement || showEmballage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {showConditionnement && (
            <ConditionnementBlock quote={quote} ps={ps} onSave={handleSaveSection} />
          )}
          {showEmballage && (
            <EmballageBlock quote={quote} ps={ps} onSave={handleSaveSection} />
          )}
        </div>
      )}

      {/* Ajouter une section */}
      {availableSections.length > 0 && (
        <AddSectionMenu
          available={availableSections}
          onAdd={key => setExtraSections(prev => new Set([...prev, key]))}
        />
      )}

    </div>
  )
}
