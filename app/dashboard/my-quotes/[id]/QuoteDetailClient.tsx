'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { upsertQuoteActuals, type ActualsInput } from '@/app/actions/actuals'
import { ClipboardCheck, TrendingUp } from 'lucide-react'

type Quote = {
  id: number
  reference: string | null
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
  study: { number: string } | null
  productType: { name: string } | null
  plate: { name: string; cost: number } | null
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
}

function DiffBadge({ estimated, actual, unit = 's' }: { estimated: number; actual: number; unit?: string }) {
  if (!estimated || !actual) return null
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
        {estimated != null && actual != null && (
          <DiffBadge estimated={estimated} actual={actual} unit={unit} />
        )}
      </div>
    </div>
  )
}

export function QuoteDetailClient({ quote }: { quote: Quote }) {
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
      {/* Résumé devis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Résumé du devis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Produit</p>
              <p className="font-medium">{quote.productType?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Format</p>
              <p className="font-medium">{quote.flatWidth && quote.flatHeight ? `${quote.flatWidth}×${quote.flatHeight} mm` : '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Quantité</p>
              <p className="font-medium">{quote.quantity} pcs</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Total devis HT</p>
              <p className="font-bold text-slate-900">{quote.totalCost != null ? `${quote.totalCost.toFixed(2)} €` : '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Matière</p>
              <p className="font-medium">{quote.plate?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Date</p>
              <p className="font-medium">{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Transport estimé</p>
              <p className="font-medium">{quote.transportTotal != null && quote.transportTotal > 0 ? `${quote.transportTotal.toFixed(2)} €` : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparatif — visible uniquement si actuals renseignés */}
      {hasActuals && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-3 bg-emerald-50 border-b border-emerald-100">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <TrendingUp className="h-4 w-4" /> Comparatif Estimé vs Réel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-0">
              <span>Poste</span>
              <span className="text-right">Estimé</span>
              <span className="text-right">Réel</span>
            </div>
            <CompareRow
              label="Découpe (sec/pose)"
              estimated={quote.cuttingTimePerPoseSeconds}
              actual={form.actualCuttingTimePerPoseSeconds ?? null}
              unit="s"
            />
            {quote.hasFaconnage && (
              <CompareRow
                label="Façonnage (sec/pce)"
                estimated={quote.assemblyTimePerPieceSeconds}
                actual={form.actualAssemblyTimePerPieceSeconds ?? null}
                unit="s"
              />
            )}
            {quote.hasConditionnement && (
              <CompareRow
                label="Conditionnement (sec/pce)"
                estimated={quote.packTimePerPieceSeconds}
                actual={form.actualPackTimePerPieceSeconds ?? null}
                unit="s"
              />
            )}
            <CompareRow
              label="Transport (€ HT)"
              estimated={quote.transportTotal}
              actual={form.actualTransportCost ?? null}
              unit="€"
            />
          </CardContent>
        </Card>
      )}

      {/* Formulaire données réelles */}
      <Card className="border-sky-200">
        <CardHeader className="pb-3 bg-sky-50 border-b border-sky-100">
          <CardTitle className="text-base flex items-center gap-2 text-sky-800">
            <ClipboardCheck className="h-4 w-4" />
            {hasActuals ? 'Mettre à jour les données réelles' : 'Saisir les données réelles'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">

          {/* Temps réels */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Temps réels (par pièce)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Découpe (sec/pose)</Label>
                <Input
                  type="number" min={0} step="0.1"
                  value={form.actualCuttingTimePerPoseSeconds ?? ''}
                  onChange={e => set('actualCuttingTimePerPoseSeconds', e.target.value)}
                  placeholder={quote.cuttingTimePerPoseSeconds ? `Estimé : ${quote.cuttingTimePerPoseSeconds}s` : 'sec/pose'}
                />
              </div>
              {quote.hasFaconnage && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Façonnage (sec/pce)</Label>
                  <Input
                    type="number" min={0} step="0.1"
                    value={form.actualAssemblyTimePerPieceSeconds ?? ''}
                    onChange={e => set('actualAssemblyTimePerPieceSeconds', e.target.value)}
                    placeholder={quote.assemblyTimePerPieceSeconds ? `Estimé : ${quote.assemblyTimePerPieceSeconds}s` : 'sec/pce'}
                  />
                </div>
              )}
              {quote.hasConditionnement && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Conditionnement (sec/pce)</Label>
                  <Input
                    type="number" min={0} step="0.1"
                    value={form.actualPackTimePerPieceSeconds ?? ''}
                    onChange={e => set('actualPackTimePerPieceSeconds', e.target.value)}
                    placeholder={quote.packTimePerPieceSeconds ? `Estimé : ${quote.packTimePerPieceSeconds}s` : 'sec/pce'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Matière réelle */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Matière</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Plaques réellement utilisées</Label>
                <Input
                  type="number" min={0} step="1"
                  value={form.actualPlatesUsed ?? ''}
                  onChange={e => set('actualPlatesUsed', e.target.value)}
                  placeholder="nombre de plaques"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">% de chutes constatées</Label>
                <Input
                  type="number" min={0} max={100} step="0.5"
                  value={form.actualWastePercent ?? ''}
                  onChange={e => set('actualWastePercent', e.target.value)}
                  placeholder="ex : 5"
                />
              </div>
            </div>
          </div>

          {/* Transport réel */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Transport réel</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Mode utilisé</Label>
                <Input
                  value={form.actualTransportMode ?? ''}
                  onChange={e => set('actualTransportMode', e.target.value)}
                  placeholder="PACK30 / MESSAGERIE_PLUS…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Coût réel HT (€)</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={form.actualTransportCost ?? ''}
                  onChange={e => set('actualTransportCost', e.target.value)}
                  placeholder={quote.transportTotal ? `Estimé : ${quote.transportTotal.toFixed(2)}€` : '€'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Poids réel (kg)</Label>
                <Input
                  type="number" min={0} step="0.1"
                  value={form.actualWeightKg ?? ''}
                  onChange={e => set('actualWeightKg', e.target.value)}
                  placeholder="kg"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes libres</Label>
            <Textarea
              value={form.notes ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, notes: e.target.value || null }))}
              placeholder="Observations, difficultés rencontrées, points d'attention pour les prochains devis similaires…"
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white">
            {saving ? 'Sauvegarde…' : hasActuals ? 'Mettre à jour' : 'Enregistrer les données réelles'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
