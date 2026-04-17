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
import { ClipboardCheck, TrendingUp, FileText, Download, Upload, X, ImageIcon } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { ProductionSheetPDF } from '@/components/pdf/ProductionSheetPDF'

// ── Types ──
type Accessory = { accessory: { name: string; price: number }; quantity: number }
type TransportDelivery = { transportMode: string; department: string; weightKg: number | null; units: number; optionsHT: number; basePriceHT: number; totalHT: number }
type ProductEntry = {
  id: number
  productTypeName: string | null
  flatWidth: number
  flatHeight: number
  quantity: number
  plate: { name: string; width: number; height: number } | null
  platesCount: number | null
  itemsPerPlate: number | null
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean
  hasFlatColor: boolean
  hasImpression: boolean
  inkMlPerPlate: number
  cuttingTimePerPoseSeconds: number
}

type Quote = {
  id: number
  reference: string | null
  client: string | null
  createdAt: Date
  quantity: number
  flatWidth: number | null
  flatHeight: number | null
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
  hasVarnish: boolean
  hasFlatColor: boolean
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
function DiffBadge({ estimated, actual }: { estimated: number; actual: number }) {
  const pct = ((actual - estimated) / estimated) * 100
  const isOver = pct > 0
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isOver ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {isOver ? '+' : ''}{pct.toFixed(0)}%
    </span>
  )
}

function CompareRow({ label, estimated, actual, unit }: { label: string; estimated: number | null; actual: number | null; unit: string }) {
  if (!estimated && !actual) return null
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-400 w-24 text-right">{estimated != null ? `${estimated} ${unit}` : '—'}</span>
        <span className="font-medium text-slate-800 w-24 text-right">{actual != null ? `${actual} ${unit}` : '—'}</span>
        {estimated != null && actual != null && <DiffBadge estimated={estimated} actual={actual} />}
      </div>
    </div>
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

// ── Onglet Fiche de production ──
function ProductionSheetTab({ quote }: { quote: Quote }) {
  const [saving, setSaving] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [form, setForm] = useState<ProductionSheetInput>({
    nbCollages:           quote.productionSheet?.nbCollages ?? null,
    collagePerPLV:        quote.productionSheet?.collagePerPLV ?? null,
    faconnageNotes:       quote.productionSheet?.faconnageNotes ?? null,
    conditionnementType:  quote.productionSheet?.conditionnementType ?? null,
    conditionnementNotes: quote.productionSheet?.conditionnementNotes ?? null,
    achatsNotes:          quote.productionSheet?.achatsNotes ?? null,
    remarques:            quote.productionSheet?.remarques ?? null,
    planImageUrl:         quote.productionSheet?.planImageUrl ?? null,
    status:               (quote.productionSheet?.status as ProductionSheetInput['status']) ?? 'en_attente',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertProductionSheet(quote.id, form)
      toast.success('Fiche de production sauvegardée !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const blob = await pdf(<ProductionSheetPDF quote={quote} productionSheet={form} />).toBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'production-sheets')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setForm(f => ({ ...f, planImageUrl: json.url }))
      toast.success('Image téléversée')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du téléversement')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status)

  // Données nomenclature (mono ou multi)
  const nomenclature = quote.isMultiProduct
    ? quote.products.map(p => ({
        designation: p.productTypeName || '—',
        matiere: p.plate ? `${p.plate.name} — ${p.plate.width}×${p.plate.height}` : '—',
        qte: p.platesCount ?? '—',
      }))
    : quote.plate ? [{
        designation: quote.productType?.name || '—',
        matiere: `${quote.plate.name} — ${quote.plate.width}×${quote.plate.height}`,
        qte: quote.platesCount ?? '—',
      }] : []

  return (
    <div className="space-y-5">

      {/* ── Statut + actions PDF ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Statut :</span>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, status: opt.value as ProductionSheetInput['status'] }))}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all border ${
                  form.status === opt.value
                    ? `${opt.color} border-transparent`
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {pdfUrl ? (
            <>
              <a href={pdfUrl} download={`fiche-prod-${quote.study?.number ?? quote.id}.pdf`}>
                <Button size="sm" variant="outline" className="gap-1">
                  <Download className="h-4 w-4" /> Télécharger PDF
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

      {/* ── Entête (données auto du devis) ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">Informations du devis</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><p className="text-slate-400 text-xs">Étude</p><p className="font-semibold">{quote.study?.number ?? '—'}</p></div>
          <div><p className="text-slate-400 text-xs">Client</p><p className="font-semibold">{quote.client ?? '—'}</p></div>
          <div><p className="text-slate-400 text-xs">Type de PLV</p><p className="font-semibold">{quote.productType?.name ?? (quote.isMultiProduct ? 'Multi-produits' : '—')}</p></div>
          <div><p className="text-slate-400 text-xs">Quantité</p><p className="font-semibold">{quote.quantity} ex</p></div>
          {!quote.isMultiProduct && (
            <div><p className="text-slate-400 text-xs">Format à plat</p><p className="font-semibold">{quote.flatWidth}×{quote.flatHeight} mm</p></div>
          )}
          {!quote.isMultiProduct && quote.itemsPerPlate && (
            <div><p className="text-slate-400 text-xs">Nb poses / plaque</p><p className="font-semibold">{quote.itemsPerPlate} ex</p></div>
          )}
        </CardContent>
      </Card>

      {/* ── Nomenclature ── */}
      {nomenclature.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">Nomenclature</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 p-0">
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
                  <tr key={i} className="border-b border-slate-50">
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

      {/* ── Impression ── */}
      {quote.hasImpression && (
        <Card className="border-purple-100">
          <CardHeader className="pb-2 bg-purple-50 border-b border-purple-100">
            <CardTitle className="text-sm text-purple-800 uppercase tracking-wide">Impression</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><p className="text-slate-400 text-xs">Nb plaques</p><p className="font-semibold">{quote.platesCount ?? '—'}</p></div>
            <div>
              <p className="text-slate-400 text-xs">Impression</p>
              <p className="font-semibold">
                {quote.isRectoVerso
                  ? `Recto/Verso — ${quote.rectoVersoType === 'identical' ? 'Identique' : 'Différent'}`
                  : 'Recto seul'}
              </p>
            </div>
            {(quote.hasVarnish || quote.hasFlatColor) && (
              <div>
                <p className="text-slate-400 text-xs">Finitions</p>
                <p className="font-semibold">
                  {[quote.hasVarnish && 'Vernis', quote.hasFlatColor && 'Blanc'].filter(Boolean).join(' + ')}
                </p>
              </div>
            )}
            <div><p className="text-slate-400 text-xs">Encre</p><p className="font-semibold">{quote.inkMlPerPlate ?? '—'} ml/plaque</p></div>
          </CardContent>
        </Card>
      )}

      {/* ── Découpe ── */}
      <Card className="border-orange-100">
        <CardHeader className="pb-2 bg-orange-50 border-b border-orange-100">
          <CardTitle className="text-sm text-orange-800 uppercase tracking-wide">Découpe</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><p className="text-slate-400 text-xs">Nb plaques</p><p className="font-semibold">{quote.platesCount ?? '—'}</p></div>
          <div><p className="text-slate-400 text-xs">Temps/pose</p><p className="font-semibold">{quote.cuttingTimePerPoseSeconds ?? '—'} sec/pose</p></div>
        </CardContent>
      </Card>

      {/* ── Façonnage (éditable) ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">Façonnage</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Temps façonnage (estimé)</p>
              <p className="font-semibold">{quote.assemblyTimePerPieceSeconds ?? 0} sec/pce</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Nb collages</Label>
              <Input
                type="number" min={0}
                value={form.nbCollages ?? ''}
                onChange={e => setForm(f => ({ ...f, nbCollages: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Mt. collage / PLV (€)</Label>
              <Input
                type="number" min={0} step="0.01"
                value={form.collagePerPLV ?? ''}
                onChange={e => setForm(f => ({ ...f, collagePerPLV: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Notes façonnage</Label>
            <Textarea
              value={form.faconnageNotes ?? ''}
              onChange={e => setForm(f => ({ ...f, faconnageNotes: e.target.value || null }))}
              placeholder="Ex : aucun, pliage simple, assemblage kit..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Conditionnement (éditable) ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">Conditionnement</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="text-sm">
            <p className="text-slate-400 text-xs mb-0.5">Temps conditionnement (estimé)</p>
            <p className="font-semibold">{quote.packTimePerPieceSeconds ?? 0} sec/pce{quote.hasAssemblyNotice ? ' + notice' : ''}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Type de conditionnement</Label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONNEMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, conditionnementType: f.conditionnementType === opt.value ? null : opt.value }))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    form.conditionnementType === opt.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Description conditionnement</Label>
            <Textarea
              value={form.conditionnementNotes ?? ''}
              onChange={e => setForm(f => ({ ...f, conditionnementNotes: e.target.value || null }))}
              placeholder="Ex : conditionnement sous kit unitaire, 5 par caisse..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Achats / Accessoires ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">Achats</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {quote.accessories.length > 0 && (
            <div className="text-sm space-y-1 mb-3">
              {quote.accessories.map((a, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span>{a.accessory.name}</span>
                  <span className="font-medium">× {a.quantity}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Notes achats / accessoires complémentaires</Label>
            <Textarea
              value={form.achatsNotes ?? ''}
              onChange={e => setForm(f => ({ ...f, achatsNotes: e.target.value || null }))}
              placeholder="Ex : 252 potences magnétiques, 5 grips..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Remarques ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">Remarques</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Textarea
            value={form.remarques ?? ''}
            onChange={e => setForm(f => ({ ...f, remarques: e.target.value || null }))}
            placeholder="Observations générales, points d'attention..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* ── Plan technique ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wide flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Plan technique
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {form.planImageUrl ? (
            <div className="relative group">
              <img
                src={form.planImageUrl}
                alt="Plan technique"
                className="rounded-md border border-slate-200 max-h-64 w-auto object-contain"
              />
              <button
                onClick={() => setForm(f => ({ ...f, planImageUrl: null }))}
                className="absolute top-2 right-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
                title="Supprimer l'image"
              >
                <X className="h-3.5 w-3.5 text-slate-500 hover:text-red-500" />
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${isUploading ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}>
              <Upload className={`h-6 w-6 ${isUploading ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}`} />
              <span className="text-sm text-slate-500">
                {isUploading ? 'Téléversement…' : 'Cliquer pour ajouter une image'}
              </span>
              <span className="text-xs text-slate-400">JPEG, PNG, WEBP — max 5 Mo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleUploadImage}
                disabled={isUploading}
              />
            </label>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        {saving ? 'Sauvegarde…' : 'Sauvegarder la fiche de production'}
      </Button>
    </div>
  )
}

// ── Onglet Données réelles (existant, extrait) ──
function ActualsTab({ quote }: { quote: Quote }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ActualsInput>({
    actualCuttingTimePerPoseSeconds:   quote.actuals?.actualCuttingTimePerPoseSeconds ?? null,
    actualAssemblyTimePerPieceSeconds: quote.actuals?.actualAssemblyTimePerPieceSeconds ?? null,
    actualPackTimePerPieceSeconds:     quote.actuals?.actualPackTimePerPieceSeconds ?? null,
    actualPlatesUsed:                  quote.actuals?.actualPlatesUsed ?? null,
    actualWastePercent:                quote.actuals?.actualWastePercent ?? null,
    actualTransportMode:               quote.actuals?.actualTransportMode ?? null,
    actualTransportCost:               quote.actuals?.actualTransportCost ?? null,
    actualWeightKg:                    quote.actuals?.actualWeightKg ?? null,
    notes:                             quote.actuals?.notes ?? null,
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

  return (
    <div className="space-y-6">
      {hasActuals && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-3 bg-emerald-50 border-b border-emerald-100">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <TrendingUp className="h-4 w-4" /> Comparatif Estimé vs Réel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              <span>Poste</span>
              <span className="text-right">Estimé</span>
              <span className="text-right">Réel</span>
            </div>
            <CompareRow label="Découpe (sec/pose)" estimated={quote.cuttingTimePerPoseSeconds} actual={form.actualCuttingTimePerPoseSeconds ?? null} unit="s" />
            {quote.hasFaconnage && <CompareRow label="Façonnage (sec/pce)" estimated={quote.assemblyTimePerPieceSeconds} actual={form.actualAssemblyTimePerPieceSeconds ?? null} unit="s" />}
            {quote.hasConditionnement && <CompareRow label="Conditionnement (sec/pce)" estimated={quote.packTimePerPieceSeconds} actual={form.actualPackTimePerPieceSeconds ?? null} unit="s" />}
            <CompareRow label="Transport (€ HT)" estimated={quote.transportTotal} actual={form.actualTransportCost ?? null} unit="€" />
          </CardContent>
        </Card>
      )}

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
                <Input type="number" min={0} step="0.1" value={form.actualCuttingTimePerPoseSeconds ?? ''} onChange={e => set('actualCuttingTimePerPoseSeconds', e.target.value)} placeholder={quote.cuttingTimePerPoseSeconds ? `Estimé : ${quote.cuttingTimePerPoseSeconds}s` : 'sec/pose'} />
              </div>
              {quote.hasFaconnage && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Façonnage (sec/pce)</Label>
                  <Input type="number" min={0} step="0.1" value={form.actualAssemblyTimePerPieceSeconds ?? ''} onChange={e => set('actualAssemblyTimePerPieceSeconds', e.target.value)} placeholder={quote.assemblyTimePerPieceSeconds ? `Estimé : ${quote.assemblyTimePerPieceSeconds}s` : 'sec/pce'} />
                </div>
              )}
              {quote.hasConditionnement && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Conditionnement (sec/pce)</Label>
                  <Input type="number" min={0} step="0.1" value={form.actualPackTimePerPieceSeconds ?? ''} onChange={e => set('actualPackTimePerPieceSeconds', e.target.value)} placeholder={quote.packTimePerPieceSeconds ? `Estimé : ${quote.packTimePerPieceSeconds}s` : 'sec/pce'} />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Matière</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Plaques réellement utilisées</Label>
                <Input type="number" min={0} step="1" value={form.actualPlatesUsed ?? ''} onChange={e => set('actualPlatesUsed', e.target.value)} placeholder="nombre de plaques" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">% de chutes constatées</Label>
                <Input type="number" min={0} max={100} step="0.5" value={form.actualWastePercent ?? ''} onChange={e => set('actualWastePercent', e.target.value)} placeholder="ex : 5" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Transport réel</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Mode utilisé</Label>
                <Input value={form.actualTransportMode ?? ''} onChange={e => set('actualTransportMode', e.target.value)} placeholder="PACK30 / MESSAGERIE_PLUS…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Coût réel HT (€)</Label>
                <Input type="number" min={0} step="0.01" value={form.actualTransportCost ?? ''} onChange={e => set('actualTransportCost', e.target.value)} placeholder={quote.transportTotal ? `Estimé : ${quote.transportTotal.toFixed(2)}€` : '€'} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Poids réel (kg)</Label>
                <Input type="number" min={0} step="0.1" value={form.actualWeightKg ?? ''} onChange={e => set('actualWeightKg', e.target.value)} placeholder="kg" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Notes libres</Label>
            <Textarea value={form.notes ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, notes: e.target.value || null }))} placeholder="Observations, difficultés rencontrées..." rows={3} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white">
            {saving ? 'Sauvegarde…' : hasActuals ? 'Mettre à jour' : 'Enregistrer les données réelles'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Composant principal avec onglets ──
export function QuoteDetailClient({ quote }: { quote: Quote }) {
  const [activeTab, setActiveTab] = useState<'devis' | 'production' | 'actuals'>('devis')

  const TABS = [
    { id: 'devis',      label: 'Résumé devis',        icon: FileText },
    { id: 'production', label: 'Fiche de production',  icon: ClipboardCheck },
    { id: 'actuals',    label: 'Données réelles',       icon: TrendingUp },
  ] as const

  const sheetStatus = quote.productionSheet?.status ?? 'en_attente'
  const statusConfig = STATUS_OPTIONS.find(s => s.value === sheetStatus)

  return (
    <div className="space-y-4">
      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-400 hover:text-slate-600'
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

      {/* ── Contenu ── */}
      {activeTab === 'devis' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Résumé du devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-slate-400 text-xs mb-0.5">Produit</p><p className="font-medium">{quote.productType?.name ?? '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Client</p><p className="font-medium">{quote.client ?? '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Format</p><p className="font-medium">{quote.flatWidth && quote.flatHeight ? `${quote.flatWidth}×${quote.flatHeight} mm` : '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Quantité</p><p className="font-medium">{quote.quantity} pcs</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Total devis HT</p><p className="font-bold text-slate-900">{quote.totalCost != null ? `${quote.totalCost.toFixed(2)} €` : '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Matière</p><p className="font-medium">{quote.plate?.name ?? '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Date</p><p className="font-medium">{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Transport estimé</p><p className="font-medium">{quote.transportTotal != null && quote.transportTotal > 0 ? `${quote.transportTotal.toFixed(2)} €` : '—'}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'production' && <ProductionSheetTab quote={quote} />}
      {activeTab === 'actuals' && <ActualsTab quote={quote} />}
    </div>
  )
}
