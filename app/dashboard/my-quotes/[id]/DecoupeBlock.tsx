'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'

function fmtSec(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}min${s}s` : `${m}min`
}

export function DecoupeBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(ps?.decoupeNotes ?? '')
  const [cuttingTime, setCuttingTime] = useState((ps?.prodCuttingTimePerPoseSeconds ?? quote.cuttingTimePerPoseSeconds ?? '').toString())
  const [itemsPerPlate, setItemsPerPlate] = useState((ps?.prodItemsPerPlate ?? quote.itemsPerPlate ?? '').toString())
  const [saving, setSaving] = useState(false)

  const prodRuns = ps?.productionAmalgameRuns ?? []
  const quoteRuns = quote.amalgameRuns ?? []
  const isAmalgame = quote.hasAmalgame || prodRuns.length > 0 || quoteRuns.length > 0

  const runs = prodRuns.length > 0
    ? prodRuns.map(r => ({
        name: r.name,
        plateName: null as string | null,
        cuttingTimeSec: null as number | null,
        items: r.items.map(it => ({ name: it.name, countPerPlate: it.countPerPlate, qty: it.quantityPerUnit })),
      }))
    : quoteRuns.map(r => ({
        name: r.name,
        plateName: r.plate?.name ?? null,
        cuttingTimeSec: r.cuttingTimePerPoseSeconds,
        items: r.items.map(it => ({ name: it.name, countPerPlate: it.countPerPlate, qty: it.quantityPerUnit })),
      }))

  const effectiveCutting = ps?.prodCuttingTimePerPoseSeconds ?? quote.cuttingTimePerPoseSeconds

  const summary = isAmalgame
    ? `${runs.length} run${runs.length > 1 ? 's' : ''} · ${runs.reduce((acc, r) => acc + r.items.length, 0)} produit${runs.reduce((acc, r) => acc + r.items.length, 0) > 1 ? 's' : ''}`
    : effectiveCutting
      ? `${fmtSec(effectiveCutting)}/pose`
      : ''

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertProductionSheet(quote.id, {
        decoupeNotes: notes || null,
        prodCuttingTimePerPoseSeconds: cuttingTime ? parseFloat(cuttingTime) : null,
        prodItemsPerPlate: itemsPerPlate ? parseInt(itemsPerPlate) : null,
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
        <span className="text-2xl leading-none">✂️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Découpe</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4">
          {isAmalgame ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Plaques de découpe</p>
              {runs.map((run, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{run.name}</p>
                    {run.plateName && <span className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-0.5">{run.plateName}</span>}
                  </div>
                  {run.cuttingTimeSec != null && (
                    <p className="text-xs text-slate-500">{fmtSec(run.cuttingTimeSec)}/pose</p>
                  )}
                  <div className="space-y-1">
                    {run.items.map((it, j) => (
                      <div key={j} className="flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          {it.name}
                        </span>
                        <span className="text-slate-400">{it.countPerPlate} poses/plaque</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Temps par pose</label>
                <input type="number" min={0} value={cuttingTime}
                  onChange={e => setCuttingTime(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pièces/plaque</label>
                <input type="number" min={0} value={itemsPerPlate}
                  onChange={e => setItemsPerPlate(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Instructions découpe…"
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
