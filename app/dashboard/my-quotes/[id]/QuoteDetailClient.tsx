'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { upsertQuoteActuals, type ActualsInput } from '@/app/actions/actuals'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import { ClipboardCheck, TrendingUp, FileText, Download, Euro, TrendingDown, ExternalLink } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDF } from '@/components/pdf/ProductionSheetPDF'
import Link from 'next/link'
import {
  HOURLY_RATE_CUTTING,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_CONDITIONING,
  INK_COST_PER_LITER,
} from '@/lib/config/pricing'

// ── Types ──
type Accessory = { accessory: { name: string; price: number }; quantity: number }
type TransportDelivery = {
  transportMode: string; department: string; weightKg: number | null
  units: number; optionsHT: number; basePriceHT: number; totalHT: number
}
type ProductEntry = {
  id: number
  productTypeName: string | null
  flatWidth: number; flatHeight: number; quantity: number
  plate: { name: string; width: number; height: number } | null
  platesCount: number | null; itemsPerPlate: number | null
  isRectoVerso: boolean; rectoVersoType: string | null
  hasVarnish: boolean; hasFlatColor: boolean; hasImpression: boolean
  inkMlPerPlate: number; cuttingTimePerPoseSeconds: number
}

type Quote = {
  id: number
  reference: string | null
  client: string | null
  createdAt: Date
  quantity: number
  flatWidth: number | null; flatHeight: number | null
  totalCost: number | null
  transportTotal: number | null
  cuttingTimePerPoseSeconds: number | null
  assemblyTimePerPieceSeconds: number | null
  packTimePerPieceSeconds: number | null
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasImpression: boolean
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean; hasFlatColor: boolean
  hasAssemblyNotice: boolean
  isMultiProduct: boolean
  inkMlPerPlate: number | null
  platesCount: number | null
  itemsPerPlate: number | null
  hasPackaging: boolean
  packagingQuantity: number | null
  packagingPlate: { name: string } | null
  packagingBoxType: string | null
  packagingMaterialType: string | null
  packagingExternalSize: string | null
  study: { number: string } | null
  productType: { name: string } | null
  plate: { name: string; cost: number; width: number; height: number } | null
  accessories: Accessory[]
  products: ProductEntry[]
  transportDeliveries: TransportDelivery[]
  actuals: {
    actualCuttingTimePerPoseSeconds: number | null
    actualAssemblyTimePerPieceSeconds: number | null
    actualPackTimePerPieceSeconds: number | null
    actualPlatesUsed: number | null
    actualWastePercent: number | null
    actualTransportMode: string | null
    actualTransportCost: number | null
    actualWeightKg: number | null
    notes: string | null
  } | null
  productionSheet: {
    prodCuttingTimePerPoseSeconds: number | null
    prodAssemblyTimePerPieceSeconds: number | null
    prodPackTimePerPieceSeconds: number | null
    prodInkMlPerPlate: number | null
    prodPlatesCount: number | null
    prodTransportCost: number | null
    prodTransportNotes: string | null
    nbCollages: number | null
    collagePerPLV: number | null
    faconnageNotes: string | null
    conditionnementType: string | null
    conditionnementNotes: string | null
    achatsNotes: string | null
    remarques: string | null
    planImageUrl: string | null
    status: string
  } | null
}

// ── Composants utilitaires ──
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-sm">{value ?? '—'}</p>
    </div>
  )
}

function SectionCard({ title, color = 'slate', children }: { title: string; color?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    slate:  'bg-slate-50 border-slate-200 text-slate-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-800',
    orange: 'bg-orange-50 border-orange-100 text-orange-800',
    sky:    'bg-sky-50 border-sky-100 text-sky-800',
    emerald:'bg-emerald-50 border-emerald-100 text-emerald-800',
    violet: 'bg-violet-50 border-violet-100 text-violet-800',
    amber:  'bg-amber-50 border-amber-100 text-amber-800',
  }
  const hdr = colors[color] ?? colors.slate
  return (
    <Card className={`border ${hdr.split(' ')[2] === 'text-slate-700' ? 'border-slate-200' : `border-${color}-100`}`}>
      <CardHeader className={`pb-2 ${hdr.split(' ')[0]} border-b ${hdr.split(' ')[1]}`}>
        <CardTitle className={`text-xs uppercase tracking-wide font-semibold ${hdr.split(' ')[2]}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

function DiffBadge({ estimated, actual, invertSign = false }: { estimated: number; actual: number; invertSign?: boolean }) {
  const pct = ((actual - estimated) / Math.abs(estimated)) * 100
  // invertSign: pour les coûts, dépasser l'estimé = mauvais (rouge)
  const isBad = invertSign ? pct > 0 : pct < 0
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBad ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  { value: 'en_cours',   label: 'En cours',   color: 'bg-blue-100 text-blue-800' },
  { value: 'termine',    label: 'Terminé',    color: 'bg-emerald-100 text-emerald-800' },
]

const CONDITIONNEMENT_OPTIONS = [
  { value: 'kit_unitaire', label: 'Kit unitaire' },
  { value: 'caisse',       label: 'En caisse' },
  { value: 'palette',      label: 'Sur palette' },
  { value: 'autre',        label: 'Autre' },
]

// ── Onglet Fiche de production (lecture seule) ──
function ProductionSheetTab({ quote }: { quote: Quote }) {
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
        status:               (ps?.status as ProductionSheetInput['status']) ?? 'en_attente',
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

      {/* ── Statut + PDF ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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

      {/* ── Informations générales ── */}
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

      {/* ── Nomenclature ── */}
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

      {/* ── Valeurs de production ── */}
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

      {/* ── Conditionnement ── */}
      {(condLabel || ps?.conditionnementNotes) && (
        <SectionCard title="Conditionnement">
          <div className="space-y-1 text-sm">
            {condLabel && <p className="font-medium text-slate-700">{condLabel}</p>}
            {ps?.conditionnementNotes && <p className="text-slate-500">{ps.conditionnementNotes}</p>}
          </div>
        </SectionCard>
      )}

      {/* ── Notes ── */}
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

      {/* ── Plan technique ── */}
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

// ── Calcul du coût réel à partir des données saisies ──
function computeActualCost(quote: Quote, form: ActualsInput): {
  materialCost: number | null
  cuttingCost: number | null
  assemblyCost: number | null
  condCost: number | null
  inkCost: number | null
  transportCost: number | null
  total: number | null
} {
  const ps = quote.productionSheet
  const platesRef = ps?.prodPlatesCount ?? quote.platesCount ?? 0
  const qty = quote.quantity

  const materialCost = (form.actualPlatesUsed != null && quote.plate)
    ? form.actualPlatesUsed * quote.plate.cost
    : null

  const inkCost = (form.actualPlatesUsed != null)
    ? (() => {
        const inkMl = ps?.prodInkMlPerPlate ?? quote.inkMlPerPlate ?? 0
        return (inkMl / 1000) * INK_COST_PER_LITER * form.actualPlatesUsed
      })()
    : null

  const cuttingCost = (form.actualCuttingTimePerPoseSeconds != null)
    ? (form.actualCuttingTimePerPoseSeconds / 3600) * platesRef * HOURLY_RATE_CUTTING
    : null

  const assemblyCost = (quote.hasFaconnage && form.actualAssemblyTimePerPieceSeconds != null)
    ? (form.actualAssemblyTimePerPieceSeconds / 3600) * qty * HOURLY_RATE_ASSEMBLY
    : null

  const condCost = (quote.hasConditionnement && form.actualPackTimePerPieceSeconds != null)
    ? (form.actualPackTimePerPieceSeconds / 3600) * qty * HOURLY_RATE_CONDITIONING
    : null

  const transportCost = form.actualTransportCost ?? null

  const parts = [materialCost, inkCost, cuttingCost, assemblyCost, condCost, transportCost]
  const total = parts.some(p => p !== null)
    ? parts.reduce((sum, p) => (sum ?? 0) + (p ?? 0), 0 as number)
    : null

  return { materialCost, cuttingCost, assemblyCost, condCost, inkCost, transportCost, total }
}

// ── Onglet Données réelles ──
function ActualsTab({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ActualsInput>({
    // Pré-rempli depuis la fiche de production, sinon depuis le devis
    actualCuttingTimePerPoseSeconds:   quote.actuals?.actualCuttingTimePerPoseSeconds   ?? ps?.prodCuttingTimePerPoseSeconds   ?? null,
    actualAssemblyTimePerPieceSeconds: quote.actuals?.actualAssemblyTimePerPieceSeconds ?? ps?.prodAssemblyTimePerPieceSeconds ?? null,
    actualPackTimePerPieceSeconds:     quote.actuals?.actualPackTimePerPieceSeconds     ?? ps?.prodPackTimePerPieceSeconds     ?? null,
    actualPlatesUsed:                  quote.actuals?.actualPlatesUsed                  ?? ps?.prodPlatesCount                ?? null,
    actualWastePercent:                quote.actuals?.actualWastePercent                ?? null,
    actualTransportMode:               quote.actuals?.actualTransportMode               ?? ps?.prodTransportNotes             ?? null,
    actualTransportCost:               quote.actuals?.actualTransportCost               ?? ps?.prodTransportCost              ?? null,
    actualWeightKg:                    quote.actuals?.actualWeightKg                    ?? null,
    notes:                             quote.actuals?.notes                             ?? null,
  })

  const hasActuals = !!quote.actuals

  const set = (field: keyof ActualsInput, raw: string) => {
    if (field === 'actualTransportMode' || field === 'notes') {
      setForm(prev => ({ ...prev, [field]: raw || null }))
    } else {
      const val = parseFloat(raw)
      setForm(prev => ({ ...prev, [field]: isNaN(val) ? null : val }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertQuoteActuals(quote.id, form)
      toast.success('Données réelles sauvegardées !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const actual = computeActualCost(quote, form)
  const estimatedTotal = quote.totalCost
  const profit = (estimatedTotal != null && actual.total != null) ? estimatedTotal - actual.total : null

  const estCuttingCost = quote.cuttingTimePerPoseSeconds != null && (ps?.prodPlatesCount ?? quote.platesCount) != null
    ? (quote.cuttingTimePerPoseSeconds / 3600) * (ps?.prodPlatesCount ?? quote.platesCount ?? 0) * HOURLY_RATE_CUTTING
    : null
  const estAssemblyCost = quote.hasFaconnage && quote.assemblyTimePerPieceSeconds != null
    ? (quote.assemblyTimePerPieceSeconds / 3600) * quote.quantity * HOURLY_RATE_ASSEMBLY
    : null
  const estCondCost = quote.hasConditionnement && quote.packTimePerPieceSeconds != null
    ? (quote.packTimePerPieceSeconds / 3600) * quote.quantity * HOURLY_RATE_CONDITIONING
    : null
  const estMaterialCost = (quote.plate && quote.platesCount)
    ? quote.platesCount * quote.plate.cost
    : null
  const estInkCost = (quote.inkMlPerPlate && quote.platesCount)
    ? (quote.inkMlPerPlate / 1000) * INK_COST_PER_LITER * quote.platesCount
    : null
  const estTransport = quote.transportTotal ?? null

  return (
    <div className="space-y-6">

      {/* ── Formulaire saisie ── */}
      <Card className="border-sky-200">
        <CardHeader className="pb-3 bg-sky-50 border-b border-sky-100">
          <CardTitle className="text-base flex items-center gap-2 text-sky-800">
            <ClipboardCheck className="h-4 w-4" />
            {hasActuals ? 'Mettre à jour les données réelles' : 'Saisir les données réelles'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Temps réels</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Découpe (sec/pose)</Label>
                <Input type="number" min={0} step="0.1"
                  value={form.actualCuttingTimePerPoseSeconds ?? ''}
                  onChange={e => set('actualCuttingTimePerPoseSeconds', e.target.value)}
                  placeholder={`Fiche : ${ps?.prodCuttingTimePerPoseSeconds ?? quote.cuttingTimePerPoseSeconds ?? '—'}s`}
                />
              </div>
              {quote.hasFaconnage && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Façonnage (sec/pce)</Label>
                  <Input type="number" min={0} step="0.1"
                    value={form.actualAssemblyTimePerPieceSeconds ?? ''}
                    onChange={e => set('actualAssemblyTimePerPieceSeconds', e.target.value)}
                    placeholder={`Fiche : ${ps?.prodAssemblyTimePerPieceSeconds ?? quote.assemblyTimePerPieceSeconds ?? '—'}s`}
                  />
                </div>
              )}
              {quote.hasConditionnement && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Conditionnement (sec/pce)</Label>
                  <Input type="number" min={0} step="0.1"
                    value={form.actualPackTimePerPieceSeconds ?? ''}
                    onChange={e => set('actualPackTimePerPieceSeconds', e.target.value)}
                    placeholder={`Fiche : ${ps?.prodPackTimePerPieceSeconds ?? quote.packTimePerPieceSeconds ?? '—'}s`}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Matière</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Plaques réellement utilisées</Label>
                <Input type="number" min={0} step="1"
                  value={form.actualPlatesUsed ?? ''}
                  onChange={e => set('actualPlatesUsed', e.target.value)}
                  placeholder={`Fiche : ${ps?.prodPlatesCount ?? quote.platesCount ?? '—'}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">% de chutes constatées</Label>
                <Input type="number" min={0} max={100} step="0.5"
                  value={form.actualWastePercent ?? ''}
                  onChange={e => set('actualWastePercent', e.target.value)}
                  placeholder="ex : 5"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Transport réel</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Mode / prestataire</Label>
                <Input
                  value={form.actualTransportMode ?? ''}
                  onChange={e => set('actualTransportMode', e.target.value)}
                  placeholder={ps?.prodTransportNotes ?? 'GEODIS / TNT...'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Coût réel HT (€)</Label>
                <Input type="number" min={0} step="0.01"
                  value={form.actualTransportCost ?? ''}
                  onChange={e => set('actualTransportCost', e.target.value)}
                  placeholder={`Fiche : ${ps?.prodTransportCost?.toFixed(2) ?? quote.transportTotal?.toFixed(2) ?? '—'}€`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Poids réel (kg)</Label>
                <Input type="number" min={0} step="0.1"
                  value={form.actualWeightKg ?? ''}
                  onChange={e => set('actualWeightKg', e.target.value)}
                  placeholder="kg"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Notes libres</Label>
            <Textarea
              value={form.notes ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, notes: e.target.value || null }))}
              placeholder="Observations, difficultés rencontrées..."
              rows={3}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white">
            {saving ? 'Sauvegarde…' : hasActuals ? 'Mettre à jour' : 'Enregistrer les données réelles'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Comparatif détaillé ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-base flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Comparatif Estimé vs Réel (temps)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 pb-2 border-b">
            <span>Poste</span>
            <span className="text-right">Estimé (devis)</span>
            <span className="text-right">Fiche de prod</span>
            <span className="text-right">Réel</span>
          </div>
          {[
            { label: 'Découpe (sec/pose)',       est: quote.cuttingTimePerPoseSeconds,    fiche: ps?.prodCuttingTimePerPoseSeconds,   reel: form.actualCuttingTimePerPoseSeconds,   unit: 's' },
            { label: 'Façonnage (sec/pce)',       est: quote.hasFaconnage ? quote.assemblyTimePerPieceSeconds : null, fiche: ps?.prodAssemblyTimePerPieceSeconds, reel: form.actualAssemblyTimePerPieceSeconds, unit: 's' },
            { label: 'Conditionnement (sec/pce)', est: quote.hasConditionnement ? quote.packTimePerPieceSeconds : null, fiche: ps?.prodPackTimePerPieceSeconds, reel: form.actualPackTimePerPieceSeconds, unit: 's' },
            { label: 'Nb plaques',               est: quote.platesCount,                  fiche: ps?.prodPlatesCount,                reel: form.actualPlatesUsed,                  unit: 'pl.' },
            { label: 'Transport (€)',            est: quote.transportTotal,               fiche: ps?.prodTransportCost,              reel: form.actualTransportCost,               unit: '€' },
          ].filter(r => r.est != null || r.fiche != null || r.reel != null).map((row, i) => (
            <div key={i} className="grid grid-cols-4 py-2 border-b border-slate-50 last:border-0 text-sm items-center">
              <span className="text-slate-600">{row.label}</span>
              <span className="text-right text-slate-400">{row.est != null ? `${row.est} ${row.unit}` : '—'}</span>
              <span className="text-right text-blue-600 font-medium">{row.fiche != null ? `${row.fiche} ${row.unit}` : '—'}</span>
              <div className="flex items-center justify-end gap-2">
                <span className="font-semibold">{row.reel != null ? `${row.reel} ${row.unit}` : '—'}</span>
                {row.est != null && row.reel != null && <DiffBadge estimated={row.est} actual={row.reel} />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Comparatif financier ── */}
      <Card className={`border-2 ${profit == null ? 'border-slate-200' : profit >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
        <CardHeader className={`pb-3 border-b ${profit == null ? 'bg-slate-50 border-slate-100' : profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <CardTitle className={`text-base flex items-center gap-2 ${profit == null ? 'text-slate-700' : profit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
            <Euro className="h-4 w-4" /> Comparatif financier
            {profit != null && (
              <span className={`ml-auto text-lg font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {profit >= 0 ? '▲' : '▼'} {Math.abs(profit).toFixed(2)} €
                <span className="text-sm font-normal ml-1">{profit >= 0 ? 'économisé' : 'dépassé'}</span>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-1">
          <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 pb-2 border-b">
            <span>Poste</span>
            <span className="text-right">Estimé (devis)</span>
            <span className="text-right">Coût réel calculé</span>
          </div>
          {[
            { label: 'Matière (plaques)',  est: estMaterialCost,  reel: actual.materialCost },
            { label: 'Encre',              est: estInkCost,       reel: actual.inkCost },
            { label: 'Découpe (machine)',  est: estCuttingCost,   reel: actual.cuttingCost },
            { label: 'Façonnage',          est: estAssemblyCost,  reel: actual.assemblyCost },
            { label: 'Conditionnement',    est: estCondCost,      reel: actual.condCost },
            { label: 'Transport',          est: estTransport,     reel: actual.transportCost },
          ].filter(r => r.est != null || r.reel != null).map((row, i) => (
            <div key={i} className="grid grid-cols-3 py-1.5 border-b border-slate-50 last:border-0 text-sm items-center">
              <span className="text-slate-600">{row.label}</span>
              <span className="text-right text-slate-400">{row.est != null ? `${row.est.toFixed(2)} €` : '—'}</span>
              <div className="flex items-center justify-end gap-2">
                <span className="font-semibold">{row.reel != null ? `${row.reel.toFixed(2)} €` : '—'}</span>
                {row.est != null && row.reel != null && <DiffBadge estimated={row.est} actual={row.reel} invertSign />}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 pt-3 mt-2 border-t-2 border-slate-200 text-sm font-bold">
            <span className="text-slate-800">TOTAL HT</span>
            <span className="text-right text-slate-600">{estimatedTotal != null ? `${estimatedTotal.toFixed(2)} €` : '—'}</span>
            <div className="flex items-center justify-end gap-2">
              <span className={actual.total != null ? (profit != null && profit >= 0 ? 'text-emerald-700' : 'text-red-700') : 'text-slate-800'}>
                {actual.total != null ? `${actual.total.toFixed(2)} €` : '—'}
              </span>
              {estimatedTotal != null && actual.total != null && (
                <DiffBadge estimated={estimatedTotal} actual={actual.total} invertSign />
              )}
            </div>
          </div>
          {profit == null && (
            <p className="text-xs text-slate-400 mt-3 italic">Renseignez les données réelles ci-dessus pour voir le comparatif financier.</p>
          )}
          {profit != null && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${profit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {profit >= 0
                ? <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />}
              {profit >= 0
                ? `Économie de ${profit.toFixed(2)} € par rapport à l'estimation du devis`
                : `Dépassement de ${Math.abs(profit).toFixed(2)} € par rapport à l'estimation du devis`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Composant principal ──
export function QuoteDetailClient({ quote }: { quote: Quote }) {
  const [activeTab, setActiveTab] = useState<'devis' | 'production' | 'actuals'>('devis')

  const TABS = [
    { id: 'devis',      label: 'Résumé devis',       icon: FileText },
    { id: 'production', label: 'Fiche de production', icon: ClipboardCheck },
    { id: 'actuals',    label: 'Données réelles',     icon: TrendingUp },
  ] as const

  const sheetStatus = quote.productionSheet?.status ?? 'en_attente'
  const statusConfig = STATUS_OPTIONS.find(s => s.value === sheetStatus)

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'production' && statusConfig && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'devis' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Résumé du devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <InfoCell label="Produit" value={quote.productType?.name} />
              <InfoCell label="Client" value={quote.client} />
              <InfoCell label="Format" value={quote.flatWidth && quote.flatHeight ? `${quote.flatWidth}×${quote.flatHeight} mm` : null} />
              <InfoCell label="Quantité" value={`${quote.quantity} pcs`} />
              <InfoCell label="Total devis HT" value={quote.totalCost != null ? <span className="font-bold text-slate-900">{quote.totalCost.toFixed(2)} €</span> : null} />
              <InfoCell label="Matière" value={quote.plate?.name} />
              <InfoCell label="Date" value={new Date(quote.createdAt).toLocaleDateString('fr-FR')} />
              <InfoCell label="Transport estimé" value={quote.transportTotal != null && quote.transportTotal > 0 ? `${quote.transportTotal.toFixed(2)} €` : null} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'production' && (
        <div className="space-y-4">
          {/* ── Accès calculateur ── */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-emerald-800">Modifier la fiche de production dans le calculateur</p>
                <p className="text-sm text-emerald-600 mt-0.5">Toutes les sections du devis, pré-remplies et modifiables pour la production.</p>
              </div>
              <Link href={`/?prodId=${quote.id}`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 whitespace-nowrap">
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans le calculateur
                </Button>
              </Link>
            </CardContent>
          </Card>
          {/* ── Données actuelles de la fiche ── */}
          <ProductionSheetTab quote={quote} />
        </div>
      )}
      {activeTab === 'actuals' && (
        <div className="space-y-4">
          {/* ── Accès calculateur ── */}
          <Card className="border-sky-200 bg-sky-50">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sky-800">Saisir les données réelles dans le calculateur</p>
                <p className="text-sm text-sky-600 mt-0.5">Pré-rempli depuis la fiche de production. Modifiez avec les valeurs réelles et sauvegardez.</p>
              </div>
              <Link href={`/?actualsId=${quote.id}`}>
                <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 whitespace-nowrap">
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans le calculateur
                </Button>
              </Link>
            </CardContent>
          </Card>
          {/* ── Comparatif financier et données sauvegardées ── */}
          <ActualsTab quote={quote} />
        </div>
      )}
    </div>
  )
}
