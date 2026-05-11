'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  createPackagingSupplierQuote,
  updatePackagingSupplierQuote,
  deletePackagingSupplierQuote,
} from '@/app/actions/reference-data'
import type { PackagingSupplierQuoteForAdmin } from '@/app/actions/reference-data'

const CATEGORY_LABELS: Record<string, string> = {
  ETUI: 'Étui',
  CAISSE: 'Caisse',
  PLAQUE_RAINEE: 'Plaque rainée',
}

const MATERIAL_LABELS: Record<string, string> = {
  B: 'B — kraft simple face',
  EB: 'EB — kraft double face',
}

const SIZE_BADGE: Record<string, { label: string; cls: string }> = {
  PETIT:  { label: 'Petit',  cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  MOYEN:  { label: 'Moyen',  cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  GRAND:  { label: 'Grand',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const CATEGORIES = ['ETUI', 'CAISSE', 'PLAQUE_RAINEE']
const MATERIALS  = ['B', 'EB']

// ── size metric & tertile assignment (mirrors server logic) ────────────────

function sizeMetric(q: { dimWidth: number | null; dimHeight: number | null; dimDepth: number | null }): number {
  const w = q.dimWidth ?? 0
  const h = q.dimHeight ?? 0
  const d = q.dimDepth ?? 0
  return d > 0 ? w * h * d : w * h
}

function assignTertiles(
  quotes: PackagingSupplierQuoteForAdmin[]
): Map<number, string> {
  const sorted = [...quotes].sort((a, b) => sizeMetric(a) - sizeMetric(b))
  const N = sorted.length
  const sizes = ['PETIT', 'MOYEN', 'GRAND']
  const map = new Map<number, string>()
  sorted.forEach((q, i) => {
    map.set(q.id, sizes[Math.min(2, Math.floor((i * 3) / N))]!)
  })
  return map
}

function groupAverages(
  quotes: PackagingSupplierQuoteForAdmin[],
  tertileMap: Map<number, string>
): Record<string, number> {
  const acc: Record<string, number[]> = {}
  for (const q of quotes) {
    const s = tertileMap.get(q.id)!
    if (!acc[s]) acc[s] = []
    acc[s].push(q.unitPrice)
  }
  const result: Record<string, number> = {}
  for (const [s, prices] of Object.entries(acc)) {
    result[s] = prices.reduce((a, b) => a + b, 0) / prices.length
  }
  return result
}

function toDateInput(iso: string) {
  return iso.slice(0, 10)
}

// ── types ──────────────────────────────────────────────────────────────────

type EditState = {
  supplierName: string
  dimWidth: string
  dimHeight: string
  dimDepth: string
  unitPrice: string
  quotedAt: string
  notes: string
}

type AddState = EditState & { category: string; material: string }

// ── component ──────────────────────────────────────────────────────────────

export function SupplierQuotesClient({
  initialQuotes,
}: {
  initialQuotes: PackagingSupplierQuoteForAdmin[]
}) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [editId, setEditId] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [addingGroup, setAddingGroup] = useState<string | null>(null)
  const [addState, setAddState] = useState<AddState | null>(null)
  const [busy, setBusy] = useState(false)

  const startEdit = (q: PackagingSupplierQuoteForAdmin) => {
    setEditId(q.id)
    setEditState({
      supplierName: q.supplierName,
      dimWidth:  q.dimWidth  != null ? String(q.dimWidth)  : '',
      dimHeight: q.dimHeight != null ? String(q.dimHeight) : '',
      dimDepth:  q.dimDepth  != null ? String(q.dimDepth)  : '',
      unitPrice: String(q.unitPrice),
      quotedAt:  toDateInput(q.quotedAt),
      notes:     q.notes ?? '',
    })
  }

  const cancelEdit = () => { setEditId(null); setEditState(null) }

  const parseNum = (s: string): number | null => {
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  const saveEdit = async (id: number) => {
    if (!editState) return
    setBusy(true)
    try {
      const patch = {
        supplierName: editState.supplierName,
        dimWidth:  parseNum(editState.dimWidth),
        dimHeight: parseNum(editState.dimHeight),
        dimDepth:  parseNum(editState.dimDepth),
        unitPrice: parseFloat(editState.unitPrice),
        quotedAt:  editState.quotedAt,
        notes:     editState.notes || undefined,
      }
      await updatePackagingSupplierQuote(id, patch)
      setQuotes((prev) => prev.map((q) => q.id !== id ? q : {
        ...q,
        ...patch,
        quotedAt: new Date(editState.quotedAt).toISOString(),
        notes: editState.notes || null,
      }))
      setEditId(null); setEditState(null)
      toast.success('Devis mis à jour — moyennes recalculées')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setBusy(false)
    }
  }

  const deleteQuote = async (q: PackagingSupplierQuoteForAdmin) => {
    if (!confirm(`Supprimer le devis de ${q.supplierName} (${q.unitPrice} €/pce) ?`)) return
    setBusy(true)
    try {
      await deletePackagingSupplierQuote(q.id)
      setQuotes((prev) => prev.filter((x) => x.id !== q.id))
      toast.success('Devis supprimé — moyennes recalculées')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setBusy(false)
    }
  }

  const startAdd = (cat: string, mat: string) => {
    setAddingGroup(`${cat}__${mat}`)
    setAddState({
      category: cat, material: mat,
      supplierName: '', dimWidth: '', dimHeight: '', dimDepth: '',
      unitPrice: '', quotedAt: new Date().toISOString().slice(0, 10), notes: '',
    })
  }

  const cancelAdd = () => { setAddingGroup(null); setAddState(null) }

  const saveAdd = async () => {
    if (!addState || !addState.supplierName || !addState.unitPrice) return
    setBusy(true)
    try {
      await createPackagingSupplierQuote({
        supplierName: addState.supplierName,
        category:     addState.category,
        material:     addState.material,
        dimWidth:     parseNum(addState.dimWidth)  ?? undefined,
        dimHeight:    parseNum(addState.dimHeight) ?? undefined,
        dimDepth:     parseNum(addState.dimDepth)  ?? undefined,
        unitPrice:    parseFloat(addState.unitPrice),
        quotedAt:     addState.quotedAt,
        notes:        addState.notes || undefined,
      })
      const fakeId = Date.now()
      setQuotes((prev) => [...prev, {
        id: fakeId,
        supplierName: addState.supplierName,
        category: addState.category,
        material: addState.material,
        dimWidth:  parseNum(addState.dimWidth),
        dimHeight: parseNum(addState.dimHeight),
        dimDepth:  parseNum(addState.dimDepth),
        unitPrice: parseFloat(addState.unitPrice),
        quotedAt:  new Date(addState.quotedAt).toISOString(),
        notes:     addState.notes || null,
      }])
      setAddingGroup(null); setAddState(null)
      toast.success('Devis ajouté — moyennes recalculées')
    } catch {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setBusy(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50 border-b border-blue-100 rounded-t-lg">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg">🗂️</span>
          Devis fournisseurs — historique &amp; calcul des moyennes
        </CardTitle>
        <CardDescription>
          Saisissez les devis avec les dimensions réelles. La classification Petit / Moyen / Grand est calculée automatiquement par tertile (volume), et les prix moyens sont mis à jour dans les règles de tarification.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-8">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              {CATEGORY_LABELS[cat]}
            </p>

            <div className="space-y-4">
              {MATERIALS.map((mat) => {
                const groupKey = `${cat}__${mat}`
                const groupQuotes = quotes.filter((q) => q.category === cat && q.material === mat)
                const tertileMap  = assignTertiles(groupQuotes)
                const avgs        = groupAverages(groupQuotes, tertileMap)
                const isAdding    = addingGroup === groupKey

                return (
                  <div key={groupKey} className="border border-slate-200 rounded-lg overflow-hidden">

                    {/* Group header */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 border-b border-slate-200">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-medium text-slate-600">{MATERIAL_LABELS[mat]}</span>
                        {(['PETIT','MOYEN','GRAND'] as const).map((s) =>
                          avgs[s] != null ? (
                            <span key={s} className={`text-xs font-semibold border rounded px-2 py-0.5 ${SIZE_BADGE[s].cls}`}>
                              {SIZE_BADGE[s].label} — moy. {avgs[s]!.toFixed(4)} €/pce
                            </span>
                          ) : null
                        )}
                        {groupQuotes.length === 0 && (
                          <span className="text-xs text-slate-400 italic">Aucun devis</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                        onClick={() => startAdd(cat, mat)}
                        disabled={isAdding || busy}
                      >
                        <Plus className="h-3.5 w-3.5" /> Ajouter un devis
                      </Button>
                    </div>

                    {/* Add form */}
                    {isAdding && addState && (
                      <div className="bg-blue-50/40 border-b border-blue-100 px-3 py-3 space-y-2">
                        <div className="grid grid-cols-[1fr_repeat(3,72px)_96px_120px_1fr_auto] gap-2 items-end text-xs">
                          <div className="space-y-1">
                            <label className="text-slate-500">Fournisseur</label>
                            <Input value={addState.supplierName} onChange={(e) => setAddState((s) => s && ({ ...s, supplierName: e.target.value }))} className="h-7 text-xs" placeholder="Nom fournisseur" />
                          </div>
                          {(['dimWidth','dimHeight','dimDepth'] as const).map((dim, i) => (
                            <div key={dim} className="space-y-1">
                              <label className="text-slate-500">{['l (mm)','L (mm)','H (mm)'][i]}</label>
                              <Input type="number" min="0" value={addState[dim]} onChange={(e) => setAddState((s) => s && ({ ...s, [dim]: e.target.value }))} className="h-7 text-xs text-right" />
                            </div>
                          ))}
                          <div className="space-y-1">
                            <label className="text-slate-500">Prix €/pce</label>
                            <Input type="number" step="0.0001" min="0" value={addState.unitPrice} onChange={(e) => setAddState((s) => s && ({ ...s, unitPrice: e.target.value }))} className="h-7 text-xs text-right" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500">Date devis</label>
                            <Input type="date" value={addState.quotedAt} onChange={(e) => setAddState((s) => s && ({ ...s, quotedAt: e.target.value }))} className="h-7 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500">Notes</label>
                            <Input value={addState.notes} onChange={(e) => setAddState((s) => s && ({ ...s, notes: e.target.value }))} className="h-7 text-xs" placeholder="Optionnel" />
                          </div>
                          <div className="flex gap-1 items-end">
                            <Button size="icon" className="h-7 w-7 bg-blue-600 hover:bg-blue-700" onClick={saveAdd} disabled={busy || !addState.supplierName || !addState.unitPrice}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelAdd} disabled={busy}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600/70 italic">Les dimensions servent à classer automatiquement le devis en Petit / Moyen / Grand par rapport aux autres devis du même groupe.</p>
                      </div>
                    )}

                    {/* Quotes table */}
                    {groupQuotes.length > 0 && (
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50/50">
                          <tr className="border-b border-slate-100">
                            <th className="text-left px-3 py-1.5 font-medium text-slate-500">Fournisseur</th>
                            <th className="text-center px-2 py-1.5 font-medium text-slate-500">l × L × H (mm)</th>
                            <th className="text-center px-2 py-1.5 font-medium text-slate-500">Taille auto</th>
                            <th className="text-right px-3 py-1.5 font-medium text-slate-500">€/pce</th>
                            <th className="text-center px-3 py-1.5 font-medium text-slate-500">Date</th>
                            <th className="text-left px-3 py-1.5 font-medium text-slate-500">Notes</th>
                            <th className="px-2 py-1.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupQuotes.map((q) => {
                            const isEditing = editId === q.id
                            const sizeKey   = tertileMap.get(q.id) ?? 'MOYEN'
                            const badge     = SIZE_BADGE[sizeKey]!
                            return (
                              <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                {isEditing && editState ? (
                                  <>
                                    <td className="px-3 py-1.5"><Input value={editState.supplierName} onChange={(e) => setEditState((s) => s && ({ ...s, supplierName: e.target.value }))} className="h-7 text-xs" /></td>
                                    <td className="px-2 py-1.5">
                                      <div className="flex gap-1">
                                        {(['dimWidth','dimHeight','dimDepth'] as const).map((dim) => (
                                          <Input key={dim} type="number" min="0" value={editState[dim]} onChange={(e) => setEditState((s) => s && ({ ...s, [dim]: e.target.value }))} className="h-7 text-xs text-right w-16" />
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-center text-slate-400 text-xs italic">recalc.</td>
                                    <td className="px-3 py-1.5"><Input type="number" step="0.0001" min="0" value={editState.unitPrice} onChange={(e) => setEditState((s) => s && ({ ...s, unitPrice: e.target.value }))} className="h-7 text-xs text-right w-24 ml-auto" /></td>
                                    <td className="px-3 py-1.5"><Input type="date" value={editState.quotedAt} onChange={(e) => setEditState((s) => s && ({ ...s, quotedAt: e.target.value }))} className="h-7 text-xs" /></td>
                                    <td className="px-3 py-1.5"><Input value={editState.notes} onChange={(e) => setEditState((s) => s && ({ ...s, notes: e.target.value }))} className="h-7 text-xs" /></td>
                                    <td className="px-2 py-1.5">
                                      <div className="flex gap-1 justify-end">
                                        <Button size="icon" className="h-6 w-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveEdit(q.id)} disabled={busy}><Check className="h-3 w-3" /></Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit} disabled={busy}><X className="h-3 w-3" /></Button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-2 font-medium text-slate-700">{q.supplierName}</td>
                                    <td className="px-2 py-2 text-center text-slate-500 font-mono">
                                      {[q.dimWidth, q.dimHeight, q.dimDepth].map((d, i) => (
                                        <span key={i}>{i > 0 && <span className="text-slate-300"> × </span>}{d != null ? d : <span className="text-slate-300">—</span>}</span>
                                      ))}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <span className={`text-xs font-semibold border rounded px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-slate-800">{q.unitPrice.toFixed(4)}</td>
                                    <td className="px-3 py-2 text-center text-slate-500">{toDateInput(q.quotedAt)}</td>
                                    <td className="px-3 py-2 text-slate-400 italic">{q.notes ?? '—'}</td>
                                    <td className="px-2 py-2">
                                      <div className="flex gap-1 justify-end">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => startEdit(q)} disabled={busy || editId !== null}><Pencil className="h-3 w-3" /></Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => deleteQuote(q)} disabled={busy}><Trash2 className="h-3 w-3" /></Button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
