'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { saveProductionAchatItems } from '@/app/actions/production-achats'
import { ensureProductionSheet } from '@/app/actions/production-amalgame'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import { getAccessories } from '@/app/actions/accessories'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import type { Quote } from './quote-detail-shared'

type LocalItem = {
  tempId: string
  name: string
  quantity: string
  unitPrice: string
}

function uid() { return Math.random().toString(36).slice(2) }

function initItems(quote: Quote): LocalItem[] {
  const dbItems = quote.productionSheet?.productionAchatItems ?? []
  if (dbItems.length > 0) {
    return dbItems.map(it => ({
      tempId: uid(),
      name: it.name,
      quantity: it.quantity.toString(),
      unitPrice: it.unitPrice != null ? it.unitPrice.toString() : '',
    }))
  }
  // Pré-rempli depuis les accessoires du devis
  const accessories = quote.accessories ?? []
  if (accessories.length > 0) {
    return accessories.map(a => ({
      tempId: uid(),
      name: a.accessory.name,
      quantity: a.quantity.toString(),
      unitPrice: a.accessory.price != null ? a.accessory.price.toString() : '',
    }))
  }
  return []
}

export function AchatsBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<LocalItem[]>(() => initItems(quote))
  const [notes, setNotes] = useState(ps?.achatsNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<{ label: string; sublabel?: string }[]>([])

  useEffect(() => {
    getAccessories().then(acc =>
      setSuggestions(acc.map(a => ({ label: a.name, sublabel: `${a.price} €` })))
    )
  }, [])

  const summary = items.length > 0
    ? `${items.length} article${items.length > 1 ? 's' : ''}`
    : ''

  const updateItem = (tempId: string, field: keyof LocalItem, value: string) =>
    setItems(prev => prev.map(it => it.tempId === tempId ? { ...it, [field]: value } : it))

  const removeItem = (tempId: string) =>
    setItems(prev => prev.filter(it => it.tempId !== tempId))

  const addItem = () =>
    setItems(prev => [...prev, { tempId: uid(), name: '', quantity: '1', unitPrice: '' }])

  const handleSave = async () => {
    setSaving(true)
    try {
      const psId = ps?.id ?? (await ensureProductionSheet(quote.id))
      await Promise.all([
        saveProductionAchatItems(psId, items.map(it => ({
          name: it.name.trim() || 'Article',
          quantity: parseFloat(it.quantity) || 1,
          unitPrice: it.unitPrice !== '' ? parseFloat(it.unitPrice) : null,
        }))),
        upsertProductionSheet(quote.id, { achatsNotes: notes || null }),
      ])
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

          {/* Liste des articles */}
          <div className="space-y-1.5">
            {items.length === 0 && (
              <p className="text-xs text-slate-400 py-1">Aucun article — ajoutez-en un.</p>
            )}
            {items.map(it => (
              <div key={it.tempId} className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                  <AutocompleteInput
                    value={it.name}
                    onChange={v => updateItem(it.tempId, 'name', v)}
                    onSelect={s => {
                      const acc = s.sublabel?.replace(' €', '')
                      if (acc && it.unitPrice === '') updateItem(it.tempId, 'unitPrice', acc)
                    }}
                    suggestions={suggestions}
                    placeholder="Nom de l'article"
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={it.quantity}
                  onChange={e => updateItem(it.tempId, 'quantity', e.target.value)}
                  placeholder="Qté"
                  className="w-14 px-2 py-1.5 text-sm text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.unitPrice}
                  onChange={e => updateItem(it.tempId, 'unitPrice', e.target.value)}
                  placeholder="Prix u."
                  className="w-20 px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <button
                  onClick={() => removeItem(it.tempId)}
                  className="p-1 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors pt-0.5"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un article
            </button>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Délais, fournisseurs, instructions…"
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
