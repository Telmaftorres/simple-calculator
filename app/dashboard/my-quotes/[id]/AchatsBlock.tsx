'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'

export function AchatsBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(ps?.achatsNotes ?? '')
  const [saving, setSaving] = useState(false)

  const accessories = quote.accessories ?? []

  const summary = [
    accessories.length > 0 ? `${accessories.length} accessoire${accessories.length > 1 ? 's' : ''}` : null,
    ps?.achatsNotes ? 'Notes' : null,
  ].filter(Boolean).join(' · ')

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertProductionSheet(quote.id, { achatsNotes: notes || null })
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
        <span className="text-2xl leading-none">🛒</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Achats</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
          {/* Accessoires du devis */}
          {accessories.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Accessoires (devis)</p>
              <div className="rounded-lg border border-slate-100 divide-y divide-slate-100">
                {accessories.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-slate-700">{a.accessory.name}</span>
                    <span className="text-xs text-slate-400">× {a.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {accessories.length === 0 && (
            <p className="text-xs text-slate-400">Aucun accessoire dans le devis.</p>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes / achats complémentaires</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Références fournisseurs, délais, achats hors devis…"
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
