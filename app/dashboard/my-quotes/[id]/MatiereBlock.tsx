'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { saveProductLinesMaterial } from '@/app/actions/production-products'
import type { Quote } from './quote-detail-shared'

const MATERIALS = ['B', 'EB', 'C', 'BC', 'E', 'Triple'] as const

// Returns the plate name hint for a given line
function getPlateName(quote: Quote, lineName: string): string | null {
  if (quote.isMultiProduct && quote.products.length > 0) {
    const match = quote.products.find(p =>
      (p.productTypeName ?? '').toLowerCase() === lineName.toLowerCase()
    ) ?? quote.products[0]
    return match?.plate?.name ?? null
  }
  if (quote.amalgameRuns.length > 0) {
    const run = quote.amalgameRuns.find(r => r.name.toLowerCase() === lineName.toLowerCase())
      ?? quote.amalgameRuns[0]
    return run?.plate?.name ?? null
  }
  return quote.plate?.name ?? null
}

export function MatiereBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const dbLines = ps?.productionProductLines ?? []

  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local state: lineId → material
  const [materials, setMaterials] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const l of dbLines) {
      map[l.id] = l.material ?? ''
    }
    return map
  })

  const hasLines = dbLines.length > 0

  const summary = hasLines
    ? dbLines
        .filter(l => materials[l.id])
        .map(l => `${l.name} : ${materials[l.id]}`)
        .join(' · ') || `${dbLines.length} produit${dbLines.length > 1 ? 's' : ''}`
    : ''

  const handleSave = async () => {
    if (!hasLines || !ps) return
    setSaving(true)
    try {
      await saveProductLinesMaterial(
        dbLines.map(l => ({ lineId: l.id, material: materials[l.id] || null })),
        quote.id
      )
      toast.success('Matières enregistrées')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-2xl border transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'} bg-white overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl leading-none">🧱</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Matière(s)</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
          {!hasLines ? (
            <p className="text-xs text-slate-400 py-1">
              Enregistrez d&apos;abord les produits dans la section Produit(s).
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {dbLines.map(line => {
                  const plateName = getPlateName(quote, line.name)
                  return (
                    <div key={line.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{line.name}</p>
                        {plateName && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Plaque devis : {plateName}</p>
                        )}
                      </div>
                      <select
                        value={materials[line.id] ?? ''}
                        onChange={e => setMaterials(prev => ({ ...prev, [line.id]: e.target.value }))}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 w-28"
                      >
                        <option value="">—</option>
                        {MATERIALS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
                  {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
