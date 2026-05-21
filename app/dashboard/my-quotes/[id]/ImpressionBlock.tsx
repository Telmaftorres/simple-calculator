'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'

function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
        active
          ? 'bg-slate-800 text-white border-slate-800'
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
      }`}
    >
      {active ? '✓' : '+'} {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"

export function ImpressionBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Champs globaux (non-amalgame + override amalgame)
  const [isRV, setIsRV] = useState(ps?.prodIsRectoVerso ?? quote.isRectoVerso)
  const [rvType, setRvType] = useState(ps?.prodRectoVersoType ?? quote.rectoVersoType ?? 'parfait')
  const [hasVarnish, setHasVarnish] = useState(ps?.prodHasVarnish ?? quote.hasVarnish)
  const [hasFlatColor, setHasFlatColor] = useState(ps?.prodHasFlatColor ?? quote.hasFlatColor)
  const [platesCount, setPlatesCount] = useState((ps?.prodPlatesCount ?? quote.platesCount ?? '').toString())
  const [inkMl, setInkMl] = useState((ps?.prodInkMlPerPlate ?? quote.inkMlPerPlate ?? '').toString())
  const [machineTime, setMachineTime] = useState((ps?.prodMachineTimeMinOverride ?? '').toString())
  const [notes, setNotes] = useState(ps?.impressionNotes ?? '')

  const amalgameScope = ps?.amalgameScope ?? 'decoupe_impression'
  const prodRuns = ps?.productionAmalgameRuns ?? []
  const quoteRuns = quote.amalgameRuns ?? []
  const hasAmalgame = quote.hasAmalgame || prodRuns.length > 0 || quoteRuns.length > 0
  const isAmalgame = hasAmalgame && amalgameScope === 'decoupe_impression'

  const runs = prodRuns.length > 0
    ? prodRuns.map(r => ({ name: r.name, platesCount: r.platesCount, items: r.items.map(i => i.name) }))
    : quoteRuns.filter(r => r.hasImpression).map(r => ({ name: r.name, platesCount: r.platesCount, items: r.items.map(i => i.name) }))

  const rvLabel = isRV
    ? (rvType === 'tete_beche' ? 'R/V tête-bêche' : 'R/V parfait')
    : 'Recto'

  const summary = isAmalgame
    ? `${runs.length} run${runs.length > 1 ? 's' : ''}`
    : [
        quote.plate?.name ?? null,
        platesCount ? `${platesCount} pl.` : null,
        rvLabel,
        hasVarnish ? 'Vernis' : null,
        hasFlatColor ? 'Blanc' : null,
      ].filter(Boolean).join(' · ')

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertProductionSheet(quote.id, {
        impressionNotes: notes || null,
        prodMachineTimeMinOverride: machineTime ? parseFloat(machineTime) : null,
        prodPlatesCount: platesCount ? parseInt(platesCount) : null,
        prodInkMlPerPlate: inkMl ? parseFloat(inkMl) : null,
        prodIsRectoVerso: isRV,
        prodRectoVersoType: isRV ? rvType : null,
        prodHasVarnish: hasVarnish,
        prodHasFlatColor: hasFlatColor,
      })
      toast.success('Enregistré')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-2xl border transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'} bg-white overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl leading-none">🖨️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Impression</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">

          {/* Mode impression + options */}
          <div className="space-y-2">
            <Field label="Mode impression">
              <select
                value={isRV ? rvType : 'recto'}
                onChange={e => {
                  if (e.target.value === 'recto') setIsRV(false)
                  else { setIsRV(true); setRvType(e.target.value) }
                }}
                className={inputCls}
              >
                <option value="recto">Recto</option>
                <option value="parfait">R/V parfait</option>
                <option value="tete_beche">R/V tête-bêche</option>
              </select>
            </Field>

            <div className="flex gap-2 flex-wrap">
              <Toggle label="Vernis" active={hasVarnish} onToggle={() => setHasVarnish(v => !v)} />
              <Toggle label="Blanc" active={hasFlatColor} onToggle={() => setHasFlatColor(v => !v)} />
            </div>
          </div>

          {/* Plaque, Nb plaques, Encre, Tps machine */}
          <div className="grid grid-cols-2 gap-2">
            {quote.plate && (
              <Field label="Plaque">
                <div className="px-2.5 py-1.5 text-sm bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
                  {quote.plate.name}
                </div>
              </Field>
            )}
            <Field label="Nb plaques">
              <input type="number" min={0} value={platesCount}
                onChange={e => setPlatesCount(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Encre (ml/plaque)">
              <input type="number" min={0} step="0.1" value={inkMl}
                onChange={e => setInkMl(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Temps machine">
              <input type="number" min={0} step="0.5" value={machineTime}
                onChange={e => setMachineTime(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
          </div>

          {/* Runs amalgame (si applicable) */}
          {isAmalgame && runs.length > 0 && (
            <div className="space-y-1.5">
              {runs.map((run, i) => (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">{run.name}</p>
                    {run.platesCount != null && (
                      <span className="text-[10px] text-slate-400">{run.platesCount} pl.</span>
                    )}
                  </div>
                  {run.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {run.items.map((name, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded-full">{name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Instructions impression…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none" />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
              {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
