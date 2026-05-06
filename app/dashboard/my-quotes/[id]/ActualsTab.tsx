'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ClipboardCheck, TrendingUp, TrendingDown, Euro } from 'lucide-react'
import { upsertQuoteActuals, type ActualsInput } from '@/app/actions/actuals'
import {
  HOURLY_RATE_CUTTING,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_CONDITIONING,
  INK_COST_PER_LITER,
} from '@/lib/config/pricing'
import { DiffBadge, type Quote } from './quote-detail-shared'

function computeActualCost(quote: Quote, form: ActualsInput) {
  const ps = quote.productionSheet
  const qty = quote.quantity

  const materialCost = (form.actualPlatesUsed != null && quote.plate)
    ? form.actualPlatesUsed * quote.plate.cost : null

  const inkCost = (form.actualPlatesUsed != null)
    ? (() => {
        const inkMl = ps?.prodInkMlPerPlate ?? quote.inkMlPerPlate ?? 0
        return (inkMl / 1000) * INK_COST_PER_LITER * form.actualPlatesUsed
      })()
    : null

  const platesRef = ps?.prodPlatesCount ?? quote.platesCount ?? 0
  const cuttingCost = (form.actualCuttingTimePerPoseSeconds != null)
    ? (form.actualCuttingTimePerPoseSeconds / 3600) * platesRef * HOURLY_RATE_CUTTING : null

  const assemblyCost = (quote.hasFaconnage && form.actualAssemblyTimePerPieceSeconds != null)
    ? (form.actualAssemblyTimePerPieceSeconds / 3600) * qty * HOURLY_RATE_ASSEMBLY : null

  const condCost = (quote.hasConditionnement && form.actualPackTimePerPieceSeconds != null)
    ? (form.actualPackTimePerPieceSeconds / 3600) * qty * HOURLY_RATE_CONDITIONING : null

  const transportCost = form.actualTransportCost ?? null

  const parts = [materialCost, inkCost, cuttingCost, assemblyCost, condCost, transportCost]
  const total = parts.some(p => p !== null)
    ? parts.reduce((sum, p) => (sum ?? 0) + (p ?? 0), 0 as number)
    : null

  return { materialCost, cuttingCost, assemblyCost, condCost, inkCost, transportCost, total }
}

export function ActualsTab({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ActualsInput>({
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
    ? (quote.cuttingTimePerPoseSeconds / 3600) * (ps?.prodPlatesCount ?? quote.platesCount ?? 0) * HOURLY_RATE_CUTTING : null
  const estAssemblyCost = quote.hasFaconnage && quote.assemblyTimePerPieceSeconds != null
    ? (quote.assemblyTimePerPieceSeconds / 3600) * quote.quantity * HOURLY_RATE_ASSEMBLY : null
  const estCondCost = quote.hasConditionnement && quote.packTimePerPieceSeconds != null
    ? (quote.packTimePerPieceSeconds / 3600) * quote.quantity * HOURLY_RATE_CONDITIONING : null
  const estMaterialCost = (quote.plate && quote.platesCount) ? quote.platesCount * quote.plate.cost : null
  const estInkCost = (quote.inkMlPerPlate && quote.platesCount)
    ? (quote.inkMlPerPlate / 1000) * INK_COST_PER_LITER * quote.platesCount : null
  const estTransport = quote.transportTotal ?? null

  return (
    <div className="space-y-6">

      {/* Formulaire saisie */}
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

      {/* Comparatif temps */}
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
            { label: 'Découpe (sec/pose)',       est: quote.cuttingTimePerPoseSeconds, fiche: ps?.prodCuttingTimePerPoseSeconds, reel: form.actualCuttingTimePerPoseSeconds, unit: 's' },
            { label: 'Façonnage (sec/pce)',       est: quote.hasFaconnage ? quote.assemblyTimePerPieceSeconds : null, fiche: ps?.prodAssemblyTimePerPieceSeconds, reel: form.actualAssemblyTimePerPieceSeconds, unit: 's' },
            { label: 'Conditionnement (sec/pce)', est: quote.hasConditionnement ? quote.packTimePerPieceSeconds : null, fiche: ps?.prodPackTimePerPieceSeconds, reel: form.actualPackTimePerPieceSeconds, unit: 's' },
            { label: 'Nb plaques',               est: quote.platesCount, fiche: ps?.prodPlatesCount, reel: form.actualPlatesUsed, unit: 'pl.' },
            { label: 'Transport (€)',            est: quote.transportTotal, fiche: ps?.prodTransportCost, reel: form.actualTransportCost, unit: '€' },
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

      {/* Comparatif financier */}
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
              {profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
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
