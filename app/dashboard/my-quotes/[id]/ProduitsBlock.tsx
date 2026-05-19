'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { saveProductionProductLines, type ProductLineInput } from '@/app/actions/production-products'
import { ensureProductionSheet } from '@/app/actions/production-amalgame'
import type { Quote } from './quote-detail-shared'

// ── Types locaux ──

type LocalElement = {
  tempId: string
  name: string
  flatWidth: string
  flatHeight: string
}

type LocalLine = {
  tempId: string
  name: string
  elements: LocalElement[]
  open: boolean
}

// ── Helpers ──

function uid() {
  return Math.random().toString(36).slice(2)
}

function makeElement(): LocalElement {
  return { tempId: uid(), name: '', flatWidth: '', flatHeight: '' }
}

function makeLine(name: string): LocalLine {
  return { tempId: uid(), name, elements: [], open: true }
}

// Initialise les lignes depuis les produits du devis
function initLinesFromDevis(quote: Quote): LocalLine[] {
  // Si multi-produit
  if (quote.isMultiProduct && quote.products.length > 0) {
    return quote.products.map((p) =>
      makeLine(p.productTypeName ?? `Produit ${p.id}`)
    )
  }
  // Devis simple avec productType
  if (quote.productType?.name) {
    return [makeLine(quote.productType.name)]
  }
  // Amalgame : un groupe = un produit
  if (quote.amalgameRuns.length > 0) {
    return quote.amalgameRuns.map((r) => makeLine(r.name))
  }
  return []
}

function initLinesFromDb(
  dbLines: NonNullable<Quote['productionSheet']>['productionProductLines']
): LocalLine[] {
  return dbLines.map((l) => ({
    tempId: uid(),
    name: l.name,
    open: false,
    elements: l.elements.map((el) => ({
      tempId: uid(),
      name: el.name,
      flatWidth: el.flatWidth.toString(),
      flatHeight: el.flatHeight.toString(),
    })),
  }))
}

// ── Sous-composants ──

function DimInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 leading-none">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
      />
    </div>
  )
}

function ElementRow({
  el,
  onUpdate,
  onRemove,
}: {
  el: LocalElement
  onUpdate: (field: keyof LocalElement, value: string) => void
  onRemove: () => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 py-2 border-b border-slate-100 last:border-0">
      <input
        type="text"
        value={el.name}
        onChange={(e) => onUpdate('name', e.target.value)}
        placeholder="Nom de l'élément"
        className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
      />
      <DimInput label="L (mm)" value={el.flatWidth} onChange={(v) => onUpdate('flatWidth', v)} />
      <span className="text-slate-300 text-xs pb-1.5">×</span>
      <DimInput label="l (mm)" value={el.flatHeight} onChange={(v) => onUpdate('flatHeight', v)} />
      <button
        onClick={onRemove}
        className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function LineCard({
  line,
  onUpdate,
  onRemove,
  onAddElement,
  onUpdateElement,
  onRemoveElement,
  onToggle,
}: {
  line: LocalLine
  onUpdate: (field: 'name', value: string) => void
  onRemove: () => void
  onAddElement: () => void
  onUpdateElement: (elId: string, field: keyof LocalElement, value: string) => void
  onRemoveElement: (elId: string) => void
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-t-xl cursor-pointer select-none"
        onClick={onToggle}
      >
        <span className="text-slate-400 text-sm">{line.open ? '▲' : '▼'}</span>
        <input
          type="text"
          value={line.name}
          onChange={(e) => { e.stopPropagation(); onUpdate('name', e.target.value) }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Nom du produit"
          className="flex-1 bg-transparent font-semibold text-sm text-slate-800 focus:outline-none focus:ring-0 placeholder-slate-300"
        />
        {line.elements.length > 0 && (
          <span className="text-xs text-slate-400 shrink-0">
            {line.elements.length} élément{line.elements.length > 1 ? 's' : ''}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      {line.open && (
        <div className="px-4 py-3 space-y-1">
          {line.elements.length > 0 ? (
            <div>
              {line.elements.map((el) => (
                <ElementRow
                  key={el.tempId}
                  el={el}
                  onUpdate={(f, v) => onUpdateElement(el.tempId, f, v)}
                  onRemove={() => onRemoveElement(el.tempId)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-1">Aucun élément — ajoutez les pièces composant ce produit.</p>
          )}
          <button
            onClick={onAddElement}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mt-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter un élément
          </button>
        </div>
      )}
    </div>
  )
}

export type SavedProductLine = {
  name: string
  elements: { name: string; flatWidth: number; flatHeight: number }[]
}

// ── Composant principal ──

export function ProduitsBlock({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet
  const dbLines = ps?.productionProductLines ?? []

  const [lines, setLines] = useState<LocalLine[]>(() =>
    dbLines.length > 0 ? initLinesFromDb(dbLines) : initLinesFromDevis(quote)
  )
  const [isPreFilled] = useState(() => dbLines.length === 0)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(true)

  // ── Mutations ──

  const updateLine = useCallback((lineId: string, field: 'name', value: string) => {
    setLines((prev) => prev.map((l) => l.tempId === lineId ? { ...l, [field]: value } : l))
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.tempId !== lineId))
  }, [])

  const toggleLine = useCallback((lineId: string) => {
    setLines((prev) => prev.map((l) => l.tempId === lineId ? { ...l, open: !l.open } : l))
  }, [])

  const addElement = useCallback((lineId: string) => {
    setLines((prev) =>
      prev.map((l) => l.tempId === lineId ? { ...l, elements: [...l.elements, makeElement()], open: true } : l)
    )
  }, [])

  const updateElement = useCallback((lineId: string, elId: string, field: keyof LocalElement, value: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.tempId === lineId
          ? { ...l, elements: l.elements.map((el) => el.tempId === elId ? { ...el, [field]: value } : el) }
          : l
      )
    )
  }, [])

  const removeElement = useCallback((lineId: string, elId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.tempId === lineId ? { ...l, elements: l.elements.filter((el) => el.tempId !== elId) } : l
      )
    )
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const psId = ps?.id ?? (await ensureProductionSheet(quote.id))
      const payload: ProductLineInput[] = lines.map((l) => ({
        name: l.name.trim() || 'Produit',
        elements: l.elements
          .filter((el) => el.name.trim())
          .map((el) => ({
            name: el.name.trim(),
            flatWidth: parseInt(el.flatWidth) || 0,
            flatHeight: parseInt(el.flatHeight) || 0,
          })),
      }))
      await saveProductionProductLines(psId, payload)
      toast.success('Produits enregistrés')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const productCount = lines.length
  const elementCount = lines.reduce((acc, l) => acc + l.elements.length, 0)
  const summary = productCount > 0
    ? `${productCount} produit${productCount > 1 ? 's' : ''}${elementCount > 0 ? ` · ${elementCount} élément${elementCount > 1 ? 's' : ''}` : ''}`
    : ''

  return (
    <div className={`rounded-2xl border transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'} bg-white overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl leading-none">🏷️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Produit(s)</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5 truncate">{summary}</p>}
        </div>
        <span className="text-slate-300 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
          {isPreFilled && dbLines.length === 0 && lines.length > 0 && (
            <p className="text-xs text-sky-600 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
              Pré-rempli depuis le devis — ajoutez les éléments puis enregistrez.
            </p>
          )}

          {lines.length === 0 && (
            <p className="text-xs text-slate-400 py-1">Aucun produit — ajoutez-en un.</p>
          )}

          {lines.map((line) => (
            <LineCard
              key={line.tempId}
              line={line}
              onUpdate={(f, v) => updateLine(line.tempId, f, v)}
              onRemove={() => removeLine(line.tempId)}
              onAddElement={() => addElement(line.tempId)}
              onUpdateElement={(elId, f, v) => updateElement(line.tempId, elId, f, v)}
              onRemoveElement={(elId) => removeElement(line.tempId, elId)}
              onToggle={() => toggleLine(line.tempId)}
            />
          ))}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setLines((prev) => [...prev, makeLine('')])}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un produit
            </button>
            <div className="flex-1" />
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
              {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
