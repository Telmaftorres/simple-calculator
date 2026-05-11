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
  B: 'B (simple face)',
  EB: 'EB (double face)',
}

const SIZE_LABELS: Record<string, string> = {
  PETIT: 'Petit',
  MOYEN: 'Moyen',
  GRAND: 'Grand',
}

type GroupKey = `${string}__${string}__${string}`

type EditState = {
  supplierName: string
  unitPrice: string
  quotedAt: string
  notes: string
}

type AddState = EditState & { category: string; material: string; size: string }

const CATEGORIES = ['ETUI', 'CAISSE', 'PLAQUE_RAINEE']
const MATERIALS = ['B', 'EB']
const SIZES = ['PETIT', 'MOYEN', 'GRAND']

function toDateInput(iso: string) {
  return iso.slice(0, 10)
}

function average(quotes: PackagingSupplierQuoteForAdmin[]) {
  if (quotes.length === 0) return null
  return quotes.reduce((s, q) => s + q.unitPrice, 0) / quotes.length
}

export function SupplierQuotesClient({
  initialQuotes,
}: {
  initialQuotes: PackagingSupplierQuoteForAdmin[]
}) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [editId, setEditId] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [addingGroup, setAddingGroup] = useState<GroupKey | null>(null)
  const [addState, setAddState] = useState<AddState | null>(null)
  const [busy, setBusy] = useState(false)

  // Group quotes by category × material × size
  const groups: Map<GroupKey, PackagingSupplierQuoteForAdmin[]> = new Map()
  for (const cat of CATEGORIES) {
    for (const mat of MATERIALS) {
      for (const size of SIZES) {
        const key: GroupKey = `${cat}__${mat}__${size}`
        groups.set(key, quotes.filter((q) => q.category === cat && q.material === mat && q.size === size))
      }
    }
  }

  const startEdit = (q: PackagingSupplierQuoteForAdmin) => {
    setEditId(q.id)
    setEditState({
      supplierName: q.supplierName,
      unitPrice: String(q.unitPrice),
      quotedAt: toDateInput(q.quotedAt),
      notes: q.notes ?? '',
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditState(null)
  }

  const saveEdit = async (id: number) => {
    if (!editState) return
    setBusy(true)
    try {
      await updatePackagingSupplierQuote(id, {
        supplierName: editState.supplierName,
        unitPrice: parseFloat(editState.unitPrice),
        quotedAt: editState.quotedAt,
        notes: editState.notes || undefined,
      })
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                supplierName: editState.supplierName,
                unitPrice: parseFloat(editState.unitPrice),
                quotedAt: new Date(editState.quotedAt).toISOString(),
                notes: editState.notes || null,
              }
            : q
        )
      )
      setEditId(null)
      setEditState(null)
      toast.success('Devis mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setBusy(false)
    }
  }

  const deleteQuote = async (q: PackagingSupplierQuoteForAdmin) => {
    if (!confirm(`Supprimer le devis de ${q.supplierName} (${q.unitPrice} €) ?`)) return
    setBusy(true)
    try {
      await deletePackagingSupplierQuote(q.id)
      setQuotes((prev) => prev.filter((x) => x.id !== q.id))
      toast.success('Devis supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setBusy(false)
    }
  }

  const startAdd = (key: GroupKey) => {
    const [cat, mat, size] = key.split('__')
    setAddingGroup(key)
    setAddState({
      category: cat,
      material: mat,
      size,
      supplierName: '',
      unitPrice: '',
      quotedAt: new Date().toISOString().slice(0, 10),
      notes: '',
    })
  }

  const cancelAdd = () => {
    setAddingGroup(null)
    setAddState(null)
  }

  const saveAdd = async () => {
    if (!addState) return
    setBusy(true)
    try {
      await createPackagingSupplierQuote({
        supplierName: addState.supplierName,
        category: addState.category,
        material: addState.material,
        size: addState.size,
        unitPrice: parseFloat(addState.unitPrice),
        quotedAt: addState.quotedAt,
        notes: addState.notes || undefined,
      })
      // Optimistic: create a fake id, real data comes on next page load; just reload quotes from server is simplest
      // Instead, do a hard refresh via router
      const fakeId = Date.now()
      setQuotes((prev) => [
        ...prev,
        {
          id: fakeId,
          supplierName: addState.supplierName,
          category: addState.category,
          material: addState.material,
          size: addState.size,
          unitPrice: parseFloat(addState.unitPrice),
          quotedAt: new Date(addState.quotedAt).toISOString(),
          notes: addState.notes || null,
        },
      ])
      setAddingGroup(null)
      setAddState(null)
      toast.success('Devis ajouté — la moyenne a été recalculée')
    } catch {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50 border-b border-blue-100 rounded-t-lg">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg">🗂️</span>
          Devis fournisseurs — historique &amp; calcul des moyennes
        </CardTitle>
        <CardDescription>
          Chaque devis est enregistré individuellement. La moyenne par groupe (type × matière × taille) est recalculée automatiquement et mise à jour comme prix de base.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-sm font-semibold text-slate-700 mb-3">{CATEGORY_LABELS[cat]}</p>
            <div className="space-y-4">
              {MATERIALS.map((mat) =>
                SIZES.map((size) => {
                  const key: GroupKey = `${cat}__${mat}__${size}`
                  const groupQuotes = groups.get(key) ?? []
                  const avg = average(groupQuotes)
                  const isAdding = addingGroup === key

                  return (
                    <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Group header */}
                      <div className="flex items-center justify-between bg-slate-50 px-3 py-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">
                            {SIZE_LABELS[size]} · {MATERIAL_LABELS[mat]}
                          </span>
                          {avg !== null && (
                            <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                              Moy. {avg.toFixed(4)} €/pce
                            </span>
                          )}
                          {groupQuotes.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Aucun devis</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => startAdd(key)}
                          disabled={isAdding || busy}
                        >
                          <Plus className="h-3.5 w-3.5" /> Ajouter
                        </Button>
                      </div>

                      {/* Add form */}
                      {isAdding && addState && (
                        <div className="bg-blue-50/40 border-b border-blue-100 px-3 py-2 grid grid-cols-[1fr_100px_120px_1fr_auto] gap-2 items-end text-xs">
                          <div className="space-y-1">
                            <label className="text-slate-500">Fournisseur</label>
                            <Input
                              value={addState.supplierName}
                              onChange={(e) => setAddState((s) => s && ({ ...s, supplierName: e.target.value }))}
                              className="h-7 text-xs"
                              placeholder="Nom fournisseur"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500">Prix €/pce</label>
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={addState.unitPrice}
                              onChange={(e) => setAddState((s) => s && ({ ...s, unitPrice: e.target.value }))}
                              className="h-7 text-xs text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500">Date devis</label>
                            <Input
                              type="date"
                              value={addState.quotedAt}
                              onChange={(e) => setAddState((s) => s && ({ ...s, quotedAt: e.target.value }))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500">Notes</label>
                            <Input
                              value={addState.notes}
                              onChange={(e) => setAddState((s) => s && ({ ...s, notes: e.target.value }))}
                              className="h-7 text-xs"
                              placeholder="Optionnel"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" className="h-7 w-7 bg-blue-600 hover:bg-blue-700" onClick={saveAdd} disabled={busy || !addState.supplierName || !addState.unitPrice}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelAdd} disabled={busy}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Quotes list */}
                      {groupQuotes.length > 0 && (
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50/50">
                            <tr className="border-b border-slate-100">
                              <th className="text-left px-3 py-1.5 font-medium text-slate-500">Fournisseur</th>
                              <th className="text-right px-3 py-1.5 font-medium text-slate-500">Prix €/pce</th>
                              <th className="text-center px-3 py-1.5 font-medium text-slate-500">Date</th>
                              <th className="text-left px-3 py-1.5 font-medium text-slate-500">Notes</th>
                              <th className="px-2 py-1.5"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupQuotes.map((q) => {
                              const isEditing = editId === q.id
                              return (
                                <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                  {isEditing && editState ? (
                                    <>
                                      <td className="px-3 py-1.5">
                                        <Input value={editState.supplierName} onChange={(e) => setEditState((s) => s && ({ ...s, supplierName: e.target.value }))} className="h-7 text-xs" />
                                      </td>
                                      <td className="px-3 py-1.5">
                                        <Input type="number" step="0.0001" min="0" value={editState.unitPrice} onChange={(e) => setEditState((s) => s && ({ ...s, unitPrice: e.target.value }))} className="h-7 text-xs text-right w-24 ml-auto" />
                                      </td>
                                      <td className="px-3 py-1.5">
                                        <Input type="date" value={editState.quotedAt} onChange={(e) => setEditState((s) => s && ({ ...s, quotedAt: e.target.value }))} className="h-7 text-xs" />
                                      </td>
                                      <td className="px-3 py-1.5">
                                        <Input value={editState.notes} onChange={(e) => setEditState((s) => s && ({ ...s, notes: e.target.value }))} className="h-7 text-xs" />
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <div className="flex gap-1 justify-end">
                                          <Button size="icon" className="h-6 w-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveEdit(q.id)} disabled={busy}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit} disabled={busy}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2 font-medium text-slate-700">{q.supplierName}</td>
                                      <td className="px-3 py-2 text-right font-mono text-slate-800">{q.unitPrice.toFixed(4)}</td>
                                      <td className="px-3 py-2 text-center text-slate-500">{toDateInput(q.quotedAt)}</td>
                                      <td className="px-3 py-2 text-slate-400 italic">{q.notes ?? '—'}</td>
                                      <td className="px-2 py-2">
                                        <div className="flex gap-1 justify-end">
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => startEdit(q)} disabled={busy || editId !== null}>
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => deleteQuote(q)} disabled={busy}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
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
                })
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
