'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'

function formatMin(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export function BEBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(ps?.beNotes ?? '')
  const [beTime, setBeTime] = useState((ps?.prodBeTimeMinutesOverride ?? '').toString())
  const [batTime, setBatTime] = useState((ps?.prodBatTimeMinutesOverride ?? '').toString())
  const [saving, setSaving] = useState(false)

  const hasBE = quote.hasBE
  const beMin = quote.beTimeMinutes
  const batMin = quote.batTimeMinutes

  const effectiveBe = ps?.prodBeTimeMinutesOverride ?? (hasBE ? beMin : null)
  const effectiveBat = ps?.prodBatTimeMinutesOverride ?? (batMin || null)

  const summary = [
    effectiveBe ? `BE ${formatMin(effectiveBe)}` : null,
    effectiveBat ? `BAT ${formatMin(effectiveBat)}` : null,
  ].filter(Boolean).join(' · ')

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertProductionSheet(quote.id, {
        beNotes: notes || null,
        prodBeTimeMinutesOverride: beTime ? parseInt(beTime) : null,
        prodBatTimeMinutesOverride: batTime ? parseInt(batTime) : null,
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
        <span className="text-2xl leading-none">📐</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Bureau d&apos;études</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
          {/* Temps BE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Temps BE (min)</label>
              <input
                type="number"
                min={0}
                value={beTime}
                onChange={e => setBeTime(e.target.value)}
                placeholder={hasBE && beMin ? beMin.toString() : '0'}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              {hasBE && beMin > 0 && (
                <p className="text-[10px] text-slate-400">Estimé devis : {formatMin(beMin)}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Temps BAT (min)</label>
              <input
                type="number"
                min={0}
                value={batTime}
                onChange={e => setBatTime(e.target.value)}
                placeholder={batMin ? batMin.toString() : '0'}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              {batMin > 0 && (
                <p className="text-[10px] text-slate-400">Estimé devis : {formatMin(batMin)}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Instructions BE / BAT…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
            />
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
