'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import {
  saveProductionAmalgameRuns,
  ensureProductionSheet,
  type AmalgameRunInput,
} from '@/app/actions/production-amalgame'
import { upsertProductionSheet } from '@/app/actions/production-sheet'
import type { Quote } from './quote-detail-shared'
import type { SavedProductLine } from './ProduitsBlock'

// ── Types ──

type AvailableItem = {
  name: string
  flatWidth: number
  flatHeight: number
  flatDepth: number | null
}

type RunItem = {
  tempId: string
  name: string
  flatWidth: number
  flatHeight: number
  flatDepth: number | null
  countPerPlate: string
  quantityPerUnit: string
}

type LocalRun = {
  tempId: string
  name: string
  open: boolean
  platesCount: string
  items: RunItem[]
}

let _c = 0
function tid() { return `t${++_c}` }

// ── Dérive la liste des items disponibles ──
function getAvailableItems(savedProducts: SavedProductLine[], quote: Quote): AvailableItem[] {
  // Priorité 1 : éléments sauvegardés dans Produits
  const fromProducts: AvailableItem[] = []
  for (const p of savedProducts) {
    if (p.elements.length > 0) {
      for (const el of p.elements) {
        if (el.name) fromProducts.push({ name: el.name, flatWidth: el.flatWidth, flatHeight: el.flatHeight, flatDepth: null })
      }
    } else if (p.name) {
      // Produit sans éléments — cherche les dims dans le devis
      const quoteProd = quote.products.find(qp => (qp.productTypeName ?? '') === p.name)
      fromProducts.push({
        name: p.name,
        flatWidth: quoteProd?.flatWidth ?? 0,
        flatHeight: quoteProd?.flatHeight ?? 0,
        flatDepth: null,
      })
    }
  }
  if (fromProducts.length > 0) return fromProducts

  // Priorité 2 : runs amalgame du devis
  if (quote.amalgameRuns.length > 0) {
    return quote.amalgameRuns.flatMap(r =>
      r.items.map(it => ({ name: it.name, flatWidth: it.flatWidth, flatHeight: it.flatHeight, flatDepth: null }))
    )
  }
  // Priorité 3 : produits multi
  if (quote.products.length > 0) {
    return quote.products.map(p => ({
      name: p.productTypeName ?? 'Produit',
      flatWidth: p.flatWidth,
      flatHeight: p.flatHeight,
      flatDepth: null,
    }))
  }
  // Priorité 4 : devis simple
  if (quote.productType && quote.flatWidth && quote.flatHeight) {
    return [{ name: quote.productType.name, flatWidth: quote.flatWidth, flatHeight: quote.flatHeight, flatDepth: null }]
  }
  return []
}

// ── Init depuis DB ──
function initRunsFromDB(dbRuns: NonNullable<Quote['productionSheet']>['productionAmalgameRuns']): LocalRun[] {
  return dbRuns.map(r => ({
    tempId: tid(),
    name: r.name,
    open: false,
    platesCount: (r.platesCount ?? '').toString(),
    items: r.items.map(it => ({
      tempId: tid(),
      name: it.name,
      flatWidth: it.flatWidth,
      flatHeight: it.flatHeight,
      flatDepth: it.flatDepth ?? null,
      countPerPlate: it.countPerPlate.toString(),
      quantityPerUnit: it.quantityPerUnit.toString(),
    })),
  }))
}

// ── Init depuis les items disponibles ──
function initRunsFromSource(available: AvailableItem[], quote: Quote): LocalRun[] {
  // Si le devis a des runs amalgame → garder leur groupement
  if (quote.amalgameRuns.length > 0) {
    return quote.amalgameRuns.map(r => ({
      tempId: tid(),
      name: r.name,
      open: true,
      platesCount: (r.platesCount ?? '').toString(),
      items: r.items.map(it => ({
        tempId: tid(),
        name: it.name,
        flatWidth: it.flatWidth,
        flatHeight: it.flatHeight,
        flatDepth: null,
        countPerPlate: it.countPerPlate.toString(),
        quantityPerUnit: it.quantityPerUnit.toString(),
      })),
    }))
  }
  // Sinon : un groupe avec tous les items
  if (available.length === 0) return [{ tempId: tid(), name: '', open: true, platesCount: '', items: [] }]
  return [{
    tempId: tid(),
    name: '',
    open: true,
    platesCount: '',
    items: available.map(it => ({ tempId: tid(), ...it, countPerPlate: '1', quantityPerUnit: '1' })),
  }]
}

// ── Block accordion ──
function Block({ emoji, title, summary, children }: { emoji: string; title: string; summary?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-2xl border transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'} bg-white overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Ligne d'item dans un run ──
function RunItemRow({ item, onChange, onRemove }: {
  item: RunItem
  onChange: (updated: RunItem) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="flex-1 text-sm text-slate-700 truncate min-w-0">{item.name}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wide leading-none">Nb/pl.</span>
          <input
            type="number"
            min={1}
            value={item.countPerPlate}
            onChange={e => onChange({ ...item, countPerPlate: e.target.value })}
            className="w-14 px-2 py-1 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wide leading-none">Qté/u.</span>
          <input
            type="number"
            min={1}
            value={item.quantityPerUnit}
            onChange={e => onChange({ ...item, quantityPerUnit: e.target.value })}
            className="w-14 px-2 py-1 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>
        <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-400 transition-colors mt-3.5">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Picker pour ajouter un item ──
function AddItemPicker({ available, onAdd }: {
  available: AvailableItem[]
  onAdd: (item: AvailableItem) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (available.length === 0) return (
    <p className="text-xs text-slate-400 italic">Définissez d&apos;abord les produits dans la section Produit(s).</p>
  )

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter un élément
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[200px] max-h-52 overflow-y-auto">
          {available.map((it, i) => (
            <button
              key={i}
              onClick={() => { onAdd(it); setOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
            >
              <span>{it.name}</span>
              {(it.flatWidth || it.flatHeight) ? (
                <span className="text-xs text-slate-400 ml-2 shrink-0">{it.flatWidth}×{it.flatHeight}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Éditeur d'un run ──
function RunEditor({ run, available, onUpdate, onDelete }: {
  run: LocalRun
  available: AvailableItem[]
  onUpdate: (r: LocalRun) => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-t-xl border-b border-slate-100">
        <button
          onClick={() => onUpdate({ ...run, open: !run.open })}
          className="text-slate-300 hover:text-slate-500 transition-colors"
        >
          {run.open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <input
          type="text"
          value={run.name}
          onChange={e => onUpdate({ ...run, name: e.target.value })}
          placeholder="Nom du groupe (ex : Corps, Fond…)"
          className="flex-1 min-w-0 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-slate-300"
        />
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] text-slate-400 uppercase tracking-wide">Plaques</span>
          <input
            type="number"
            min={1}
            value={run.platesCount}
            onChange={e => onUpdate({ ...run, platesCount: e.target.value })}
            placeholder="—"
            className="w-12 px-1.5 py-0.5 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>
        <span className="text-xs text-slate-400 shrink-0">{run.items.length} él.</span>
        <button onClick={onDelete} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {run.open && (
        <div className="px-3 pb-3 pt-2 space-y-1">
          {run.items.length === 0 && (
            <p className="text-xs text-slate-400 py-1">Aucun élément — ajoutez-en depuis la liste.</p>
          )}
          {run.items.map((item, idx) => (
            <RunItemRow
              key={item.tempId}
              item={item}
              onChange={updated => onUpdate({ ...run, items: run.items.map((it, i) => i === idx ? updated : it) })}
              onRemove={() => onUpdate({ ...run, items: run.items.filter((_, i) => i !== idx) })}
            />
          ))}
          <div className="pt-1">
            <AddItemPicker
              available={available}
              onAdd={av => onUpdate({ ...run, items: [...run.items, { tempId: tid(), ...av, countPerPlate: '1', quantityPerUnit: '1' }] })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ──

export function AmalgameBlock({ quote, savedProducts }: { quote: Quote; savedProducts: SavedProductLine[] }) {
  const dbRuns = quote.productionSheet?.productionAmalgameRuns ?? []
  const available = getAvailableItems(savedProducts, quote)

  const [runs, setRuns] = useState<LocalRun[]>(() =>
    dbRuns.length > 0 ? initRunsFromDB(dbRuns) : initRunsFromSource(available, quote)
  )
  const [scope, setScope] = useState<'decoupe' | 'decoupe_impression'>(
    (quote.productionSheet?.amalgameScope as 'decoupe' | 'decoupe_impression') ?? 'decoupe_impression'
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const psId = quote.productionSheet?.id ?? await ensureProductionSheet(quote.id)
      const payload: AmalgameRunInput[] = runs.map(r => ({
        name: r.name || 'Groupe sans nom',
        platesCount: r.platesCount ? parseInt(r.platesCount) : null,
        items: r.items.map(it => ({
          name: it.name,
          flatWidth: it.flatWidth,
          flatHeight: it.flatHeight,
          flatDepth: it.flatDepth,
          countPerPlate: parseInt(it.countPerPlate) || 1,
          quantityPerUnit: parseInt(it.quantityPerUnit) || 1,
        })),
      }))
      await Promise.all([
        saveProductionAmalgameRuns(psId, payload),
        upsertProductionSheet(quote.id, { amalgameScope: scope }),
      ])
      toast.success('Amalgame enregistré')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const totalItems = runs.reduce((n, r) => n + r.items.length, 0)
  const summary = runs.length > 0
    ? `${runs.length} groupe${runs.length > 1 ? 's' : ''} · ${totalItems} élément${totalItems > 1 ? 's' : ''}`
    : ''

  return (
    <Block emoji="🔀" title="Amalgame" summary={summary}>
      <div className="space-y-3">
        {/* Scope */}
        <div className="flex gap-2">
          {([
            { value: 'decoupe_impression', label: 'Découpe + Impression' },
            { value: 'decoupe',            label: 'Découpe uniquement' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setScope(opt.value)}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                scope === opt.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Groupes */}
        {runs.map((run, ri) => (
          <RunEditor
            key={run.tempId}
            run={run}
            available={available}
            onUpdate={updated => setRuns(prev => prev.map((r, i) => i === ri ? updated : r))}
            onDelete={() => setRuns(prev => prev.filter((_, i) => i !== ri))}
          />
        ))}

        <button
          onClick={() => setRuns(prev => [...prev, { tempId: tid(), name: '', open: true, platesCount: '', items: [] }])}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:text-slate-800 transition-colors bg-white w-full justify-center"
        >
          <Plus className="h-4 w-4" /> Ajouter un groupe
        </button>

        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Block>
  )
}
