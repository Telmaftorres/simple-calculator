'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertProductionSheet, type ProductionSheetInput } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'

function fmtSec(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}min${s}s` : `${m}min`
}

export function FaconnageBlock({
  quote,
  ps,
  onSave,
}: {
  quote: Quote
  ps: NonNullable<Quote['productionSheet']>
  onSave: (data: Partial<ProductionSheetInput>) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [assemblyTime, setAssemblyTime] = useState((ps.prodAssemblyTimePerPieceSeconds ?? quote.assemblyTimePerPieceSeconds ?? '').toString())
  const [nbCollages, setNbCollages]   = useState((ps.nbCollages ?? '').toString())
  const [collagePLV, setCollagePLV]   = useState((ps.collagePerPLV ?? '').toString())
  const [notes, setNotes]             = useState(ps.faconnageNotes ?? '')
  const [saving, setSaving]           = useState(false)

  const summary = [
    assemblyTime ? `${assemblyTime}s/pce` : null,
    nbCollages ? `${nbCollages} collage${parseInt(nbCollages) > 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ')

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertProductionSheet(quote.id, {
        prodAssemblyTimePerPieceSeconds: assemblyTime ? parseFloat(assemblyTime) : null,
        nbCollages:    nbCollages  ? parseInt(nbCollages)    : null,
        collagePerPLV: collagePLV  ? parseFloat(collagePLV)  : null,
        faconnageNotes: notes || null,
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
        <span className="text-2xl leading-none">🔧</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Façonnage</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Temps façonnage (s/pce)</label>
              <input
                type="number"
                min={0}
                value={assemblyTime}
                onChange={e => setAssemblyTime(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nb collages</label>
              <input
                type="number"
                value={nbCollages}
                onChange={e => setNbCollages(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Collage / PLV (min)</label>
              <input
                type="number"
                step="0.1"
                value={collagePLV}
                onChange={e => setCollagePLV(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Instructions façonnage / assemblage…"
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
