'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'

function InfoPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-700 mt-0.5">{value ?? '—'}</p>
    </div>
  )
}

export function ImpressionBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(ps?.impressionNotes ?? '')
  const [platesCount, setPlatesCount] = useState((ps?.prodPlatesCount ?? quote.platesCount ?? '').toString())
  const [inkMl, setInkMl] = useState((ps?.prodInkMlPerPlate ?? quote.inkMlPerPlate ?? '').toString())
  const [machineTime, setMachineTime] = useState((ps?.prodMachineTimeMinOverride ?? '').toString())
  const [isRV, setIsRV] = useState(ps?.prodIsRectoVerso ?? quote.isRectoVerso)
  const [rvType, setRvType] = useState(ps?.prodRectoVersoType ?? quote.rectoVersoType ?? 'parfait')
  const [saving, setSaving] = useState(false)

  const amalgameScope = ps?.amalgameScope ?? 'decoupe_impression'
  const prodRuns = ps?.productionAmalgameRuns ?? []
  const quoteRuns = quote.amalgameRuns ?? []
  const hasAmalgameData = quote.hasAmalgame || prodRuns.length > 0 || quoteRuns.length > 0
  const isAmalgame = hasAmalgameData && amalgameScope === 'decoupe_impression'

  const runs = prodRuns.length > 0
    ? prodRuns.map(r => ({
        name: r.name,
        plateName: null as string | null,
        hasImpression: true,
        isRectoVerso: false,
        rectoVersoType: null as string | null,
        platesCount: r.platesCount,
        inkMlPerPlate: null as number | null,
        items: r.items.map(it => it.name),
      }))
    : quoteRuns.map(r => ({
        name: r.name,
        plateName: r.plate?.name ?? null,
        hasImpression: r.hasImpression,
        isRectoVerso: r.isRectoVerso,
        rectoVersoType: r.rectoVersoType,
        platesCount: r.platesCount,
        inkMlPerPlate: r.inkMlPerPlate,
        items: r.items.map(it => it.name),
      }))

  const rvLabel = isRV ? (rvType === 'parfait' ? 'R/V parfait' : rvType === 'tete_beche' ? 'R/V tête-bêche' : 'R/V') : 'Recto'

  const summary = isAmalgame
    ? `${runs.filter(r => r.hasImpression).length} run${runs.filter(r => r.hasImpression).length > 1 ? 's' : ''} impression`
    : quote.hasImpression
      ? [
          quote.plate?.name ?? null,
          platesCount ? `${platesCount} plaque${parseInt(platesCount) > 1 ? 's' : ''}` : null,
        ].filter(Boolean).join(' · ')
      : 'Sans impression'

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
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4">
          {isAmalgame ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Runs d&apos;impression</p>
              {runs.map((run, i) => (
                <div key={i} className={`rounded-xl border p-3 space-y-2 ${run.hasImpression ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{run.name}</p>
                    {!run.hasImpression && (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Sans impression</span>
                    )}
                  </div>
                  {run.hasImpression && (
                    <div className="grid grid-cols-2 gap-2">
                      <InfoPill label="Plaque" value={run.plateName ?? '—'} />
                      <InfoPill label="Mode" value={run.isRectoVerso ? (run.rectoVersoType === 'parfait' ? 'R/V parfait' : 'R/V tête-bêche') : 'Recto'} />
                      {run.platesCount != null && <InfoPill label="Nbre plaques" value={run.platesCount} />}
                      {run.inkMlPerPlate != null && <InfoPill label="Encre" value={`${run.inkMlPerPlate} ml`} />}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {run.items.map((name, j) => (
                      <span key={j} className="text-[11px] px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-100">{name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {!quote.hasImpression ? (
                <p className="text-xs text-slate-400">Ce produit n&apos;a pas d&apos;impression.</p>
              ) : (
                <>
                  {/* Plaque (lecture seule) + R/V éditable */}
                  <div className="grid grid-cols-2 gap-2">
                    <InfoPill label="Plaque" value={quote.plate?.name ?? '—'} />
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Mode impression</label>
                      <select
                        value={isRV ? rvType : 'recto'}
                        onChange={e => {
                          if (e.target.value === 'recto') { setIsRV(false) }
                          else { setIsRV(true); setRvType(e.target.value) }
                        }}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                      >
                        <option value="recto">Recto</option>
                        <option value="parfait">R/V parfait</option>
                        <option value="tete_beche">R/V tête-bêche</option>
                      </select>
                    </div>
                  </div>

                  {/* Nb plaques, Encre, Tps machine */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Nb plaques</label>
                      <input type="number" min={0} value={platesCount}
                        onChange={e => setPlatesCount(e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Encre (ml)</label>
                      <input type="number" min={0} value={inkMl}
                        onChange={e => setInkMl(e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tps machine (min)</label>
                      <input type="number" min={0} value={machineTime}
                        onChange={e => setMachineTime(e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
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
