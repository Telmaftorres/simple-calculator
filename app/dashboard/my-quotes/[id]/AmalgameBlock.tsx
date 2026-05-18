'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2, Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
import {
  saveProductionAmalgameRuns,
  ensureProductionSheet,
  getProductTemplatesBasic,
  type AmalgameRunInput,
} from '@/app/actions/production-amalgame'
import type { Quote } from './quote-detail-shared'

// ── Types locaux ──

type LocalItem = {
  tempId: string
  name: string
  flatWidth: string
  flatHeight: string
  flatDepth: string  // vide = 2D
  countPerPlate: string
  quantityPerUnit: string
}

type LocalRun = {
  tempId: string
  name: string
  open: boolean
  items: LocalItem[]
}

type TemplateBasic = Awaited<ReturnType<typeof getProductTemplatesBasic>>[number]

let _tempCounter = 0
function tid() { return `t${++_tempCounter}` }

function makeItem(overrides: Partial<Omit<LocalItem, 'tempId'>> = {}): LocalItem {
  return {
    tempId: tid(),
    name: '',
    flatWidth: '',
    flatHeight: '',
    flatDepth: '',
    countPerPlate: '1',
    quantityPerUnit: '1',
    ...overrides,
  }
}

function makeRun(name = ''): LocalRun {
  return { tempId: tid(), name, open: true, items: [makeItem()] }
}

// Initialise l'état local depuis les données DB
function initRuns(dbRuns: NonNullable<Quote['productionSheet']>['productionAmalgameRuns']): LocalRun[] {
  if (!dbRuns.length) return []
  return dbRuns.map(r => ({
    tempId: tid(),
    name: r.name,
    open: false,
    items: r.items.map(it => ({
      tempId: tid(),
      name: it.name,
      flatWidth: it.flatWidth.toString(),
      flatHeight: it.flatHeight.toString(),
      flatDepth: it.flatDepth != null ? it.flatDepth.toString() : '',
      countPerPlate: it.countPerPlate.toString(),
      quantityPerUnit: it.quantityPerUnit.toString(),
    })),
  }))
}

// Sources "depuis le devis" : renvoie la liste des items du devis
function getDevisItems(quote: Quote): { name: string; flatWidth: number; flatHeight: number }[] {
  if (quote.hasAmalgame && quote.amalgameRuns.length > 0) {
    return quote.amalgameRuns.flatMap(r =>
      r.items.map(it => ({ name: it.name, flatWidth: it.flatWidth, flatHeight: it.flatHeight }))
    )
  }
  if (quote.productType?.name && quote.flatWidth && quote.flatHeight) {
    return [{ name: quote.productType.name, flatWidth: quote.flatWidth, flatHeight: quote.flatHeight }]
  }
  return []
}

// Récupère les items d'un run depuis r.items OU depuis quote.products (multi-produit avec amalgame)
function getRunItems(r: Quote['amalgameRuns'][number], quote: Quote) {
  if (r.items.length > 0) return r.items
  // Fallback : produits avec amalgameGroupIndex === position du run
  return quote.products
    .filter(p => p.amalgameGroupIndex === r.position)
    .map(p => ({
      name: p.productTypeName ?? 'Produit',
      flatWidth: p.flatWidth,
      flatHeight: p.flatHeight,
      countPerPlate: p.countPerPlateInGroup ?? p.itemsPerPlate ?? 1,
      quantityPerUnit: 1 as const,
    }))
}

// Pré-remplit les groupes de production depuis le devis
function initRunsFromDevis(quote: Quote): LocalRun[] {
  if (quote.hasAmalgame && quote.amalgameRuns.length > 0) {
    const runs: LocalRun[] = quote.amalgameRuns.map(r => {
      const items = getRunItems(r, quote)
      return {
        tempId: tid(),
        name: r.name,
        open: true,
        items: items.length > 0
          ? items.map(it => makeItem({
              name: it.name,
              flatWidth: it.flatWidth.toString(),
              flatHeight: it.flatHeight.toString(),
              countPerPlate: it.countPerPlate.toString(),
            }))
          : [makeItem()],
      }
    })
    // Produits hors amalgame (pas dans un run) → groupes séparés
    const standalone = quote.products.filter(p => p.amalgameGroupIndex === null)
    for (const p of standalone) {
      runs.push({
        tempId: tid(),
        name: p.productTypeName ?? 'Produit',
        open: true,
        items: [makeItem({
          name: p.productTypeName ?? 'Produit',
          flatWidth: p.flatWidth.toString(),
          flatHeight: p.flatHeight.toString(),
          countPerPlate: (p.itemsPerPlate ?? 1).toString(),
        })],
      })
    }
    return runs
  }
  if (quote.isMultiProduct && quote.products.length > 0) {
    const groups = new Map<number | string, typeof quote.products>()
    for (const p of quote.products) {
      const key = p.amalgameGroupIndex != null ? p.amalgameGroupIndex : `solo_${p.id}`
      const arr = groups.get(key) ?? []
      arr.push(p)
      groups.set(key, arr)
    }
    return Array.from(groups.values()).map((prods, i) => ({
      tempId: tid(),
      name: prods.length === 1 ? (prods[0].productTypeName ?? `Groupe ${i + 1}`) : `Groupe ${i + 1}`,
      open: true,
      items: prods.map(p => makeItem({
        name: p.productTypeName ?? `Produit ${p.id}`,
        flatWidth: p.flatWidth.toString(),
        flatHeight: p.flatHeight.toString(),
        countPerPlate: (p.countPerPlateInGroup ?? p.itemsPerPlate ?? 1).toString(),
      })),
    }))
  }
  return [makeRun()]
}

// ── Bloc accordéon identique au style existant ──

function Block({
  emoji, title, summary, children,
}: { emoji: string; title: string; summary?: string; children: React.ReactNode }) {
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

// ── Popup "ajouter un élément" ──

function AddItemMenu({
  quoteItems,
  templates,
  onLoadTemplates,
  onAddManual,
  onAddFromDevis,
  onAddFromTemplate,
}: {
  quoteItems: { name: string; flatWidth: number; flatHeight: number }[]
  templates: TemplateBasic[] | null
  onLoadTemplates: () => void
  onAddManual: () => void
  onAddFromDevis: (item: { name: string; flatWidth: number; flatHeight: number }) => void
  onAddFromTemplate: (tpl: TemplateBasic) => void
}) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<'devis' | 'template' | null>(null)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setPanel(null) } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filteredTemplates = templates?.filter(t => t.name.toLowerCase().includes(search.toLowerCase())) ?? []

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors"
      >
        <Plus className="h-3 w-3" /> Ajouter un élément
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[220px]">
          {panel === null && (
            <>
              <button
                onClick={() => { onAddManual(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
              >
                ✏️ Saisir manuellement
              </button>
              {quoteItems.length > 0 && (
                <button
                  onClick={() => setPanel('devis')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
                >
                  📋 Depuis le devis <ChevronDown className="h-3 w-3 ml-auto" />
                </button>
              )}
              <button
                onClick={() => { onLoadTemplates(); setPanel('template') }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
              >
                📐 Depuis un modèle <ChevronDown className="h-3 w-3 ml-auto" />
              </button>
            </>
          )}

          {panel === 'devis' && (
            <>
              <button onClick={() => setPanel(null)} className="flex items-center gap-1 px-4 py-2 text-xs text-slate-400 hover:text-slate-600">
                <ChevronUp className="h-3 w-3" /> Retour
              </button>
              {quoteItems.map((it, i) => (
                <button
                  key={i}
                  onClick={() => { onAddFromDevis(it); setOpen(false); setPanel(null) }}
                  className="w-full flex flex-col px-4 py-2.5 text-left hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700 font-medium">{it.name}</span>
                  <span className="text-xs text-slate-400">{it.flatWidth} × {it.flatHeight} mm</span>
                </button>
              ))}
            </>
          )}

          {panel === 'template' && (
            <>
              <button onClick={() => setPanel(null)} className="flex items-center gap-1 px-4 py-2 text-xs text-slate-400 hover:text-slate-600">
                <ChevronUp className="h-3 w-3" /> Retour
              </button>
              <div className="px-3 pb-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              {templates === null && (
                <p className="px-4 py-2 text-xs text-slate-400">Chargement…</p>
              )}
              {templates !== null && filteredTemplates.length === 0 && (
                <p className="px-4 py-2 text-xs text-slate-400">Aucun modèle trouvé</p>
              )}
              <div className="max-h-52 overflow-y-auto">
                {filteredTemplates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => { onAddFromTemplate(tpl); setOpen(false); setPanel(null); setSearch('') }}
                    className="w-full flex flex-col px-4 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-700 font-medium">{tpl.name}</span>
                    {tpl.flatWidth && tpl.flatHeight ? (
                      <span className="text-xs text-slate-400">
                        {tpl.flatWidth} × {tpl.flatHeight}{tpl.flatDepth ? ` × ${tpl.flatDepth}` : ''} mm
                      </span>
                    ) : tpl.amalgameRuns.length > 0 ? (
                      <span className="text-xs text-slate-400">{tpl.amalgameRuns.reduce((n, r) => n + r.items.length, 0)} éléments</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Ligne d'un item dans un run ──

function ItemRow({
  item,
  onChange,
  onDelete,
}: {
  item: LocalItem
  onChange: (updated: LocalItem) => void
  onDelete: () => void
}) {
  const is3D = item.flatDepth !== ''
  const set = (field: keyof LocalItem) => (v: string) => onChange({ ...item, [field]: v })

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 items-center text-sm">
      {/* Nom */}
      <input
        type="text"
        value={item.name}
        onChange={e => set('name')(e.target.value)}
        placeholder="Nom de l'élément"
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 min-w-0"
      />

      {/* L */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={item.flatWidth}
          onChange={e => set('flatWidth')(e.target.value)}
          placeholder="L"
          className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-700"
        />
        <span className="text-xs text-slate-400">mm</span>
      </div>

      {/* × */}
      <span className="text-slate-300 text-xs">×</span>

      {/* l */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={item.flatHeight}
          onChange={e => set('flatHeight')(e.target.value)}
          placeholder="l"
          className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-700"
        />
        <span className="text-xs text-slate-400">mm</span>
      </div>

      {/* H (optionnel) */}
      {is3D ? (
        <>
          <span className="text-slate-300 text-xs">×</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={item.flatDepth}
              onChange={e => set('flatDepth')(e.target.value)}
              placeholder="H"
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
            <span className="text-xs text-slate-400">mm</span>
            <button
              onClick={() => onChange({ ...item, flatDepth: '' })}
              title="Passer en 2D"
              className="text-slate-300 hover:text-slate-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => onChange({ ...item, flatDepth: '0' })}
          title="Ajouter une hauteur (3D)"
          className="px-2 py-1.5 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg hover:border-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
        >
          + H
        </button>
      )}

      {/* × par plaque */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 whitespace-nowrap">×</span>
        <input
          type="number"
          value={item.countPerPlate}
          onChange={e => set('countPerPlate')(e.target.value)}
          placeholder="1"
          min={1}
          className="w-12 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-700"
        />
        <span className="text-xs text-slate-400">/pl.</span>
      </div>

      {/* Supprimer */}
      <button
        onClick={onDelete}
        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Éditeur d'un run ──

function RunEditor({
  run,
  quoteItems,
  templates,
  onLoadTemplates,
  onUpdate,
  onDelete,
}: {
  run: LocalRun
  quoteItems: { name: string; flatWidth: number; flatHeight: number }[]
  templates: TemplateBasic[] | null
  onLoadTemplates: () => void
  onUpdate: (updated: LocalRun) => void
  onDelete: () => void
}) {
  const addItem = (item: LocalItem) => onUpdate({ ...run, items: [...run.items, item] })

  const handleAddFromTemplate = (tpl: TemplateBasic) => {
    if (tpl.amalgameRuns.length > 0) {
      // Importer tous les items du premier run du template
      const newItems = tpl.amalgameRuns[0].items.map(it => makeItem({
        name: it.name,
        flatWidth: it.flatWidth.toString(),
        flatHeight: it.flatHeight.toString(),
        flatDepth: '',
      }))
      onUpdate({ ...run, items: [...run.items, ...newItems] })
    } else if (tpl.flatWidth && tpl.flatHeight) {
      addItem(makeItem({
        name: tpl.name,
        flatWidth: tpl.flatWidth.toString(),
        flatHeight: tpl.flatHeight.toString(),
        flatDepth: tpl.flatDepth != null ? tpl.flatDepth.toString() : '',
      }))
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      {/* En-tête du run */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
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
          placeholder="Nom du groupe (ex : Corps totem, Fond, Couvercle…)"
          className="flex-1 px-0 py-0 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-slate-300"
        />
        <span className="text-xs text-slate-400 shrink-0">{run.items.length} élément{run.items.length > 1 ? 's' : ''}</span>
        <button
          onClick={onDelete}
          className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Items */}
      {run.open && (
        <div className="p-4 space-y-2">
          {/* Légende */}
          {run.items.length > 0 && (
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Nom</span>
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold w-16 text-center">L</span>
              <span className="text-xs text-slate-400"></span>
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold w-16 text-center">l</span>
              <span className="text-xs text-slate-400 w-16"></span>
              <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold text-center">× /pl.</span>
              <span className="text-xs text-slate-400"></span>
            </div>
          )}

          {run.items.map((item, idx) => (
            <ItemRow
              key={item.tempId}
              item={item}
              onChange={updated => onUpdate({ ...run, items: run.items.map((it, i) => i === idx ? updated : it) })}
              onDelete={() => onUpdate({ ...run, items: run.items.filter((_, i) => i !== idx) })}
            />
          ))}

          <AddItemMenu
            quoteItems={quoteItems}
            templates={templates}
            onLoadTemplates={onLoadTemplates}
            onAddManual={() => addItem(makeItem())}
            onAddFromDevis={it => addItem(makeItem({ name: it.name, flatWidth: it.flatWidth.toString(), flatHeight: it.flatHeight.toString() }))}
            onAddFromTemplate={handleAddFromTemplate}
          />
        </div>
      )}
    </div>
  )
}

// ── Référence devis (lecture seule) ──

function QuoteAmalgameRef({ quote }: { quote: Quote }) {
  const [open, setOpen] = useState(false)
  const { amalgameRuns, products } = quote

  const rvLabel = (r: Quote['amalgameRuns'][number]) => {
    if (!r.isRectoVerso) return null
    return r.rectoVersoType === 'different' ? 'R/V différent' : 'R/V'
  }

  const standaloneProducts = products.filter(p => p.amalgameGroupIndex === null)
  const totalPasses = amalgameRuns.length + (standaloneProducts.length > 0 ? 1 : 0)

  const ItemsTable = ({ items }: { items: { name: string; flatWidth: number; flatHeight: number; countPerPlate: number; quantityPerUnit: number }[] }) => (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-slate-400 border-b border-slate-100">
          <th className="text-left px-3 py-1.5 font-semibold uppercase tracking-wide">Élément</th>
          <th className="text-right px-3 py-1.5 font-semibold uppercase tracking-wide">L × l</th>
          <th className="text-right px-3 py-1.5 font-semibold uppercase tracking-wide">Nb/plaque</th>
          <th className="text-right px-3 py-1.5 font-semibold uppercase tracking-wide">Qté/unité</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={4} className="px-3 py-3 text-slate-400 italic text-center">Aucun élément trouvé</td></tr>
        ) : items.map((it, ii) => (
          <tr key={ii} className={ii % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
            <td className="px-3 py-2 font-medium text-slate-700">{it.name}</td>
            <td className="px-3 py-2 text-right text-slate-500 tabular-nums">{it.flatWidth} × {it.flatHeight} mm</td>
            <td className="px-3 py-2 text-right text-slate-500 tabular-nums">{it.countPerPlate}</td>
            <td className="px-3 py-2 text-right text-slate-500 tabular-nums">{it.quantityPerUnit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-100/60 transition-colors"
      >
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
          Devis — {totalPasses} passe{totalPasses > 1 ? 's' : ''}
        </span>
        <span className="ml-auto text-blue-300">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Passes amalgame */}
          {amalgameRuns.map((r, ri) => {
            const displayItems = getRunItems(r, quote)
            return (
              <div key={ri} className="rounded-lg border border-blue-100 bg-white overflow-hidden">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-blue-50 border-b border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">{r.name}</span>
                  {r.plate && (
                    <span className="text-xs text-blue-500">📐 {r.plate.name} — {r.plate.width} × {r.plate.height} mm</span>
                  )}
                  {r.platesCount != null && (
                    <span className="text-xs text-blue-500">{r.platesCount} plaque{r.platesCount > 1 ? 's' : ''}</span>
                  )}
                  {r.hasImpression && (
                    <span className="text-xs text-blue-500">🖨 {r.inkMlPerPlate} ml/pl.</span>
                  )}
                  {rvLabel(r) && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">{rvLabel(r)}</span>
                  )}
                  {r.cuttingTimePerPoseSeconds > 0 && (
                    <span className="text-xs text-blue-500">✂️ {r.cuttingTimePerPoseSeconds}s/pose</span>
                  )}
                </div>
                <ItemsTable items={displayItems} />
              </div>
            )
          })}

          {/* Produits hors amalgame (ex : Socle seul) */}
          {standaloneProducts.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-white overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-blue-50 border-b border-blue-100">
                <span className="text-sm font-semibold text-blue-700">Produits hors amalgame</span>
              </div>
              <ItemsTable items={standaloneProducts.map(p => ({
                name: p.productTypeName ?? 'Produit',
                flatWidth: p.flatWidth,
                flatHeight: p.flatHeight,
                countPerPlate: p.itemsPerPlate ?? 1,
                quantityPerUnit: 1,
              }))} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ──

export function AmalgameBlock({ quote }: { quote: Quote }) {
  const dbRuns = quote.productionSheet?.productionAmalgameRuns ?? []
  // Si aucune donnée sauvegardée, pré-remplit automatiquement depuis le devis
  const [runs, setRuns] = useState<LocalRun[]>(() =>
    dbRuns.length > 0 ? initRuns(dbRuns) : initRunsFromDevis(quote)
  )
  const [isPreFilled] = useState(() => dbRuns.length === 0)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<TemplateBasic[] | null>(null)
  const templatesLoading = useRef(false)

  const devisItems = getDevisItems(quote)

  const loadTemplates = useCallback(async () => {
    if (templates !== null || templatesLoading.current) return
    templatesLoading.current = true
    try {
      const data = await getProductTemplatesBasic()
      setTemplates(data)
    } catch {
      toast.error('Impossible de charger les modèles')
    } finally {
      templatesLoading.current = false
    }
  }, [templates])

  const handleSave = async () => {
    setSaving(true)
    try {
      const psId = quote.productionSheet?.id ?? await ensureProductionSheet(quote.id)

      const payload: AmalgameRunInput[] = runs.map(r => ({
        name: r.name || 'Groupe sans nom',
        items: r.items.map(it => ({
          name: it.name || 'Élément',
          flatWidth: parseInt(it.flatWidth) || 0,
          flatHeight: parseInt(it.flatHeight) || 0,
          flatDepth: it.flatDepth !== '' ? (parseInt(it.flatDepth) || 0) : null,
          countPerPlate: parseInt(it.countPerPlate) || 1,
          quantityPerUnit: parseInt(it.quantityPerUnit) || 1,
        })),
      }))

      await saveProductionAmalgameRuns(psId, payload)
      toast.success('Amalgame enregistré')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const totalItems = runs.reduce((n, r) => n + r.items.length, 0)
  const summary = `${runs.length} groupe${runs.length > 1 ? 's' : ''} · ${totalItems} élément${totalItems > 1 ? 's' : ''}`

  return (
    <Block emoji="🔀" title="Amalgame" summary={summary}>
      <div className="space-y-3">
        {/* Référence devis — repliée par défaut, consultable */}
        {(quote.hasAmalgame || quote.isMultiProduct) && (
          <QuoteAmalgameRef quote={quote} />
        )}

        {/* Bandeau informatif si pré-rempli (non encore sauvegardé) */}
        {isPreFilled && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <span>ℹ️</span>
            Pré-rempli depuis le devis — vérifiez les valeurs et cliquez <strong className="text-slate-700">Enregistrer</strong> pour valider.
          </div>
        )}

        {/* Runs de production */}
        {runs.map((run, ri) => (
          <RunEditor
            key={run.tempId}
            run={run}
            quoteItems={devisItems}
            templates={templates}
            onLoadTemplates={loadTemplates}
            onUpdate={updated => setRuns(prev => prev.map((r, i) => i === ri ? updated : r))}
            onDelete={() => setRuns(prev => prev.filter((_, i) => i !== ri))}
          />
        ))}

        {/* Ajouter un groupe */}
        <button
          onClick={() => setRuns(prev => [...prev, makeRun()])}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:text-slate-800 transition-colors bg-white w-full justify-center"
        >
          <Plus className="h-4 w-4" /> Ajouter un groupe
        </button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-700"
        >
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </Button>
      </div>
    </Block>
  )
}
