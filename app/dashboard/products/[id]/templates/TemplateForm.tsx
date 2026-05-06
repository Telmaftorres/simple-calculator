'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, PlusCircle, Trash2, X, Layers, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createProductTemplate, updateProductTemplate } from '@/app/actions/catalog'
import { createAccessory } from '@/app/actions/accessories'
import { GaugeSlider } from '@/components/calculator/GaugeSlider'
import { INK_SHORTCUTS, FINISHING_SHORTCUTS, ASSEMBLY_SHORTCUTS, PACK_SHORTCUTS, CUTTING_SHORTCUTS } from '@/lib/config/ui'
import { formatMinutes, formatTimeSeconds } from '@/lib/format'
import Link from 'next/link'
import { evalFormula, resolveFlatFormula } from '@/lib/utils'
import type { AmalgameGroup, ProductSlot } from '@/types/calculator'
import { GROUP_COLORS, DEFAULT_PRODUCT_SLOT } from '@/types/calculator'
import { GroupEditor } from '@/app/calculator/sections/multiproduct/GroupEditor'

// ── Types ──────────────────────────────────────────────────────────────────

type Plate = { id: number; name: string; width: number; height: number; cost: number; material: string }
type AccessoryItem = { id: number; name: string; price: number }
type SelectedAccessory = { accessoryId: number; name: string; price: number; quantity: number }


type TemplateFormData = {
  id?: number
  productTypeId: number
  name: string
  formatType: '2d' | '3d'
  flatWidth: number | null
  flatDepth: number | null
  flatHeight: number | null
  plateId: number | null
  // Impression
  hasImpression: boolean
  printMode: 'production' | 'quality'
  printSetupType: 'none' | 'standard' | 'complexe'
  isRectoVerso: boolean
  rectoVersoType: 'identical' | 'different' | null
  hasVarnish: boolean
  hasFlatColor: boolean
  inkMlPerPlate: number
  inkMlVerso: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  // Découpe
  cuttingTimePerPoseSeconds: number
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  // Façonnage
  hasFaconnage: boolean
  assemblyTimePerPieceSeconds: number
  // Conditionnement
  hasConditionnement: boolean
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  // Accessoires
  hasAccessoires: boolean
  // Transport
  // Notes
  notes: string
}

type TypeElement = { id: number; name: string; quantity: number }

type TypeOptionVariant = { id: number; label: string; priceHT: number | null }

type TypeOption = {
  id: number
  name: string
  inputType: string
  priceHT: number | null
  variants: TypeOptionVariant[]
}

type TemplateElementEntry = {
  elementId: number
  quantity: number
  formatType: '2d' | '3d'
  flatWidth: number | null
  flatHeight: number | null
  flatDepth: number | null
  plateId: number | null
  amalgameGroupId: string | null
  hasImpression: boolean
  printMode: 'production' | 'quality'
  printSetupType: 'none' | 'standard' | 'complexe'
  isRectoVerso: boolean
  rectoVersoType: 'identical' | 'different' | null
  hasVarnish: boolean
  hasFlatColor: boolean
  inkMlPerPlate: number
  inkMlVerso: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  cuttingTimePerPoseSeconds: number
  cuttingSetupType: 'none' | 'standard' | 'complexe'
}

const DEFAULT_ELEMENT_SETTINGS: Omit<TemplateElementEntry, 'elementId' | 'quantity'> = {
  formatType: '2d',
  flatWidth: null,
  flatHeight: null,
  flatDepth: null,
  plateId: null,
  amalgameGroupId: null,
  hasImpression: true,
  printMode: 'production',
  printSetupType: 'none',
  isRectoVerso: false,
  rectoVersoType: null,
  hasVarnish: false,
  hasFlatColor: false,
  inkMlPerPlate: 20,
  inkMlVerso: 0,
  varnishSurfacePercent: 0,
  flatColorSurfacePercent: 0,
  cuttingTimePerPoseSeconds: 0,
  cuttingSetupType: 'none',
}
type TemplateVariantEntry = { variantId: number; defaultQuantity: number }
type TemplateOptionEntry = { optionId: number; defaultQuantity: number }

type Props = {
  productTypeId: number
  productTypeName: string
  plates: Plate[]
  allAccessories: AccessoryItem[]
  typeElements?: TypeElement[]
  typeOptions?: TypeOption[]
  initialData?: Partial<TemplateFormData>
  initialAccessories?: SelectedAccessory[]
  initialElements?: Omit<TemplateElementEntry, 'formatType'>[]
  initialVariantConfigs?: TemplateVariantEntry[]
  initialOptionConfigs?: TemplateOptionEntry[]
  initialAmalgameGroupsJson?: string | null
  flatWidthFormula?: string
  flatHeightFormula?: string
}

// ── Constantes ──────────────────────────────────────────────────────────────


// ── Composants utilitaires ──────────────────────────────────────────────────

function SectionHeader({ number, title, color = 'slate' }: { number: string; title: string; color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500', blue: 'bg-blue-500', violet: 'bg-violet-500',
    orange: 'bg-orange-500', pink: 'bg-pink-500', teal: 'bg-teal-500', slate: 'bg-slate-500',
    sky: 'bg-sky-500',
  }
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-7 h-7 ${colors[color] ?? colors.slate} text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0`}>
        {number}
      </div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
    </div>
  )
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
        active ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-300 text-slate-500 hover:border-slate-400'
      }`}>
      {children}
    </button>
  )
}

function ShortcutRow<T extends number>({ values, current, onSelect, activeClass }: {
  values: T[]; current: T; onSelect: (v: T) => void; activeClass?: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {values.map((v) => (
        <button key={v} type="button" onClick={() => onSelect(v)}
          className={`px-2.5 py-1 text-xs rounded border transition-all ${
            current === v
              ? (activeClass ?? 'bg-slate-600 text-white border-slate-600')
              : 'border-slate-200 text-slate-500 hover:border-slate-400'
          }`}>
          {v}
        </button>
      ))}
    </div>
  )
}

// ── Composant principal ─────────────────────────────────────────────────────

export default function TemplateForm({ productTypeId, productTypeName, plates, allAccessories, typeElements = [], typeOptions = [], initialData, initialAccessories = [], initialElements = [], initialVariantConfigs = [], initialOptionConfigs = [], initialAmalgameGroupsJson, flatWidthFormula = 'l', flatHeightFormula = 'L' }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<TemplateFormData>({
    productTypeId,
    name: initialData?.name ?? '',
    formatType: initialData?.formatType ?? '2d',
    flatWidth: initialData?.flatWidth ?? null,
    flatDepth: initialData?.flatDepth ?? null,
    flatHeight: initialData?.flatHeight ?? null,
    plateId: initialData?.plateId ?? null,
    hasImpression: initialData?.hasImpression ?? true,
    printMode: initialData?.printMode ?? 'production',
    printSetupType: initialData?.printSetupType ?? 'none',
    isRectoVerso: initialData?.isRectoVerso ?? false,
    rectoVersoType: initialData?.rectoVersoType ?? null,
    hasVarnish: initialData?.hasVarnish ?? false,
    hasFlatColor: initialData?.hasFlatColor ?? false,
    inkMlPerPlate: initialData?.inkMlPerPlate ?? 20,
    inkMlVerso: initialData?.inkMlVerso ?? 0,
    varnishSurfacePercent: initialData?.varnishSurfacePercent ?? 0,
    flatColorSurfacePercent: initialData?.flatColorSurfacePercent ?? 0,
    cuttingTimePerPoseSeconds: initialData?.cuttingTimePerPoseSeconds ?? 0,
    cuttingSetupType: initialData?.cuttingSetupType ?? 'none',
    hasFaconnage: initialData?.hasFaconnage ?? true,
    assemblyTimePerPieceSeconds: initialData?.assemblyTimePerPieceSeconds ?? 0,
    hasConditionnement: initialData?.hasConditionnement ?? true,
    packTimePerPieceSeconds: initialData?.packTimePerPieceSeconds ?? 0,
    hasAssemblyNotice: initialData?.hasAssemblyNotice ?? false,
    hasAccessoires: initialData?.hasAccessoires ?? false,
    notes: initialData?.notes ?? '',
  })

  const set = <K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // ── Accessoires ──
  const [accessories, setAccessories] = useState<AccessoryItem[]>(allAccessories)
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>(initialAccessories)
  const [currentAccessoryId, setCurrentAccessoryId] = useState('')
  const [currentQty, setCurrentQty] = useState(1)
  const [showCreateAcc, setShowCreateAcc] = useState(false)
  const [newAccName, setNewAccName] = useState('')
  const [newAccPrice, setNewAccPrice] = useState('')
  const [isCreatingAcc, setIsCreatingAcc] = useState(false)

  const handleAddAccessory = () => {
    if (!currentAccessoryId || currentQty <= 0) return
    const acc = accessories.find((a) => a.id.toString() === currentAccessoryId)
    if (!acc) return
    setSelectedAccessories((prev) => {
      const existing = prev.find((a) => a.accessoryId === acc.id)
      if (existing) return prev.map((a) => a.accessoryId === acc.id ? { ...a, quantity: a.quantity + currentQty } : a)
      return [...prev, { accessoryId: acc.id, name: acc.name, price: acc.price, quantity: currentQty }]
    })
    setCurrentAccessoryId('')
    setCurrentQty(1)
  }

  const handleRemoveAccessory = (accessoryId: number) =>
    setSelectedAccessories((prev) => prev.filter((a) => a.accessoryId !== accessoryId))

  const handleCreateAccessory = async () => {
    const price = parseFloat(newAccPrice)
    if (!newAccName.trim() || isNaN(price) || price <= 0) return
    setIsCreatingAcc(true)
    try {
      const created = await createAccessory({ name: newAccName.trim(), price })
      setAccessories((prev) => [...prev, { id: created.id, name: created.name, price: created.price }])
      setNewAccName('')
      setNewAccPrice('')
      setShowCreateAcc(false)
      toast.success(`Accessoire "${created.name}" créé`)
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setIsCreatingAcc(false)
    }
  }

  const getFlatDimensions = (width: number | null, depth: number | null, height: number | null, formatType = form.formatType) => {
    if (formatType !== '3d') {
      return { width, height, canCalculate: width != null && height != null }
    }
    if (!width || !depth || !height) {
      return { width: null, height: null, canCalculate: false }
    }
    const widthFormula = resolveFlatFormula(flatWidthFormula, 'width', '3d')
    const heightFormula = resolveFlatFormula(flatHeightFormula, 'height', '3d')
    return {
      width: evalFormula(widthFormula, width, depth, height),
      height: evalFormula(heightFormula, width, depth, height),
      canCalculate: true,
    }
  }

  const templateFlatDimensions = getFlatDimensions(form.flatWidth, form.flatDepth, form.flatHeight)
  const displayFlatWidthFormula = resolveFlatFormula(flatWidthFormula, 'width', form.formatType)
  const displayFlatHeightFormula = resolveFlatFormula(flatHeightFormula, 'height', form.formatType)

  // ── Éléments inclus ──
  const [selectedElements, setSelectedElements] = useState<TemplateElementEntry[]>(
    initialElements.map((e) => ({ ...DEFAULT_ELEMENT_SETTINGS, ...e, formatType: (e.flatDepth != null ? '3d' : '2d') as '2d' | '3d' }))
  )
  const [activeElementId, setActiveElementId] = useState<number | null>(null)
  const isMultiElementMode = selectedElements.length >= 2
  const activeEl = activeElementId !== null
    ? selectedElements.find((e) => e.elementId === activeElementId)
    : selectedElements[0] ?? null

  const toggleElement = (el: TypeElement) => {
    setSelectedElements((prev) => {
      const existing = prev.find((e) => e.elementId === el.id)
      if (existing) {
        const next = prev.filter((e) => e.elementId !== el.id)
        if (activeElementId === el.id) setActiveElementId(next[0]?.elementId ?? null)
        return next
      }
      return [...prev, { ...DEFAULT_ELEMENT_SETTINGS, elementId: el.id, quantity: el.quantity }]
    })
  }

  const updateElementQty = (elementId: number, qty: number) => {
    setSelectedElements((prev) => prev.map((e) => e.elementId === elementId ? { ...e, quantity: qty } : e))
  }

  const updateElement = <K extends keyof TemplateElementEntry>(elementId: number, field: K, value: TemplateElementEntry[K]) => {
    setSelectedElements((prev) => prev.map((e) => e.elementId === elementId ? { ...e, [field]: value } : e))
  }

  // ── Options / variantes incluses ──
  const [selectedVariants, setSelectedVariants] = useState<TemplateVariantEntry[]>(initialVariantConfigs)

  const toggleVariant = (variantId: number) => {
    setSelectedVariants((prev) => {
      const existing = prev.find((v) => v.variantId === variantId)
      if (existing) return prev.filter((v) => v.variantId !== variantId)
      return [...prev, { variantId, defaultQuantity: 1 }]
    })
  }

  const updateVariantQty = (variantId: number, qty: number) => {
    setSelectedVariants((prev) => prev.map((v) => v.variantId === variantId ? { ...v, defaultQuantity: qty } : v))
  }

  // ── Options directes (sans variantes) ──
  const [selectedOptionConfigs, setSelectedOptionConfigs] = useState<TemplateOptionEntry[]>(initialOptionConfigs)

  const toggleOptionConfig = (optionId: number) => {
    setSelectedOptionConfigs((prev) => {
      const existing = prev.find((o) => o.optionId === optionId)
      if (existing) return prev.filter((o) => o.optionId !== optionId)
      return [...prev, { optionId, defaultQuantity: 1 }]
    })
  }

  const updateOptionConfigQty = (optionId: number, qty: number) => {
    setSelectedOptionConfigs((prev) => prev.map((o) => o.optionId === optionId ? { ...o, defaultQuantity: qty } : o))
  }

  // ── Groupes d'amalgame (système multi-produit) ──
  const [amalgameGroups, setAmalgameGroups] = useState<AmalgameGroup[]>(() => {
    if (!initialAmalgameGroupsJson) return []
    try { return JSON.parse(initialAmalgameGroupsJson) } catch { return [] }
  })
  const [editingGroupId, setEditingGroupId] = useState<string | 'new' | null>(null)

  const elementsAsSlots: ProductSlot[] = selectedElements.map((se) => ({
    ...DEFAULT_PRODUCT_SLOT,
    id: se.elementId.toString(),
    productSearch: typeElements.find((e) => e.id === se.elementId)?.name ?? `Élément ${se.elementId}`,
    flatWidth: getFlatDimensions(se.flatWidth, se.flatDepth, se.flatHeight, se.formatType).width ?? 0,
    flatHeight: getFlatDimensions(se.flatWidth, se.flatDepth, se.flatHeight, se.formatType).height ?? 0,
    quantity: se.quantity,
    selectedPlateId: se.plateId?.toString() ?? '',
    amalgameGroupId: se.amalgameGroupId ?? null,
    hasImpression: se.hasImpression,
    printMode: se.printMode,
    printSetupType: se.printSetupType,
    isRectoVerso: se.isRectoVerso,
    rectoVersoType: se.rectoVersoType,
    inkMlPerPlate: se.inkMlPerPlate,
    inkMlVerso: se.inkMlVerso,
    varnishSurfacePercent: se.varnishSurfacePercent,
    flatColorSurfacePercent: se.flatColorSurfacePercent,
    cuttingTimePerPoseSeconds: se.cuttingTimePerPoseSeconds,
    cuttingSetupType: se.cuttingSetupType,
  }))

  const handleAmalgameSave = (group: AmalgameGroup, productIds: string[]) => {
    setAmalgameGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id)
      if (exists) return prev.map((g) => g.id === group.id ? group : g)
      return [...prev, group]
    })
    setSelectedElements((prev) => prev.map((se) => {
      const elementIdStr = se.elementId.toString()
      if (productIds.includes(elementIdStr)) return { ...se, amalgameGroupId: group.id }
      if (se.amalgameGroupId === group.id) return { ...se, amalgameGroupId: null }
      return se
    }))
    setEditingGroupId(null)
  }

  const handleAmalgameDelete = (groupId: string) => {
    setAmalgameGroups((prev) => prev.filter((g) => g.id !== groupId))
    setSelectedElements((prev) => prev.map((se) =>
      se.amalgameGroupId === groupId ? { ...se, amalgameGroupId: null } : se
    ))
  }

  // ── Soumission ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          notes: form.notes || undefined,
          amalgameGroupsJson: amalgameGroups.length > 0 ? JSON.stringify(amalgameGroups) : null,
        }
        const accPayload = selectedAccessories.map((a) => ({ accessoryId: a.accessoryId, quantity: a.quantity }))
        const elementsPayload = selectedElements.filter((e) => e.quantity > 0).map(({ elementId, quantity, flatWidth, flatHeight, flatDepth, plateId, amalgameGroupId, formatType: _ft, ...rest }) => ({
          elementId, quantity,
          flatWidth: flatWidth ?? undefined,
          flatHeight: flatHeight ?? undefined,
          flatDepth: flatDepth ?? undefined,
          plateId: plateId ?? undefined,
          amalgameGroupId: amalgameGroupId ?? undefined,
          ...rest,
        }))
        const variantsPayload = selectedVariants.filter((v) => v.defaultQuantity > 0)
        const optionConfigsPayload = selectedOptionConfigs.filter((o) => o.defaultQuantity > 0)

        if (initialData?.id) {
          await updateProductTemplate(initialData.id, payload, accPayload, [], elementsPayload, variantsPayload, optionConfigsPayload)
          toast.success('Modèle mis à jour')
        } else {
          await createProductTemplate(payload, accPayload, [], elementsPayload, variantsPayload, optionConfigsPayload)
          toast.success('Modèle créé')
        }
        router.push(`/dashboard/products/${productTypeId}`)
      } catch {
        toast.error('Erreur lors de la sauvegarde')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/products/${productTypeId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData?.id ? 'Modifier le modèle' : 'Nouveau modèle standard'}
          </h2>
          <p className="text-slate-500 text-sm">{productTypeName}</p>
        </div>
      </div>

      {/* ── Composition du modèle ── */}
      {(typeElements.length > 0 || typeOptions.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Composition du modèle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Éléments */}
            {typeElements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Éléments</p>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  {typeElements.map((el, i) => {
                    const selected = selectedElements.find((e) => e.elementId === el.id)
                    return (
                      <div
                        key={el.id}
                        onClick={() => toggleElement(el)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${i > 0 ? 'border-t border-slate-100' : ''} ${
                          selected ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-sm transition-colors ${selected ? 'font-semibold text-teal-700' : 'font-medium text-slate-500'}`}>
                          {el.name}
                        </span>
                        {selected ? (
                          <div
                            className="flex items-center gap-0.5 bg-white border border-teal-200 rounded-lg px-1 py-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button type="button" onClick={() => updateElementQty(el.id, Math.max(1, selected.quantity - 1))}
                              className="w-6 h-6 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium">−</button>
                            <span className="text-sm font-bold text-teal-700 min-w-[20px] text-center">{selected.quantity}</span>
                            <button type="button" onClick={() => updateElementQty(el.id, selected.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium">+</button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-base">+</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Options */}
            {typeOptions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Options</p>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  {typeOptions.map((option, oi) => {
                    const hasVariants = option.variants.length > 0
                    if (hasVariants) {
                      return option.variants.map((variant, vi) => {
                        const sel = selectedVariants.find((v) => v.variantId === variant.id)
                        return (
                          <div
                            key={variant.id}
                            onClick={() => toggleVariant(variant.id)}
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${(oi > 0 || vi > 0) ? 'border-t border-slate-100' : ''} ${
                              sel ? 'bg-sky-50' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <span className={`text-sm transition-colors ${sel ? 'font-semibold text-sky-700' : 'font-medium text-slate-500'}`}>
                                {variant.label}
                              </span>
                              {variant.priceHT != null && (
                                <span className={`ml-2 text-xs ${sel ? 'text-sky-400' : 'text-slate-400'}`}>{variant.priceHT.toFixed(2)} €/pièce</span>
                              )}
                            </div>
                            {sel ? (
                              <div className="flex items-center gap-0.5 bg-white border border-sky-200 rounded-lg px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => updateVariantQty(variant.id, Math.max(1, sel.defaultQuantity - 1))}
                                  className="w-6 h-6 flex items-center justify-center text-sky-600 hover:bg-sky-50 rounded transition-colors font-medium">−</button>
                                <span className="text-sm font-bold text-sky-700 min-w-[20px] text-center">{sel.defaultQuantity}</span>
                                <button type="button" onClick={() => updateVariantQty(variant.id, sel.defaultQuantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center text-sky-600 hover:bg-sky-50 rounded transition-colors font-medium">+</button>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-base">+</span>
                            )}
                          </div>
                        )
                      })
                    }
                    // Option sans variante
                    const sel = selectedOptionConfigs.find((o) => o.optionId === option.id)
                    return (
                      <div
                        key={option.id}
                        onClick={() => toggleOptionConfig(option.id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${oi > 0 ? 'border-t border-slate-100' : ''} ${
                          sel ? 'bg-sky-50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className={`text-sm transition-colors ${sel ? 'font-semibold text-sky-700' : 'font-medium text-slate-500'}`}>
                            {option.name}
                          </span>
                          {option.priceHT != null && (
                            <span className={`ml-2 text-xs ${sel ? 'text-sky-400' : 'text-slate-400'}`}>{option.priceHT.toFixed(2)} €/pièce</span>
                          )}
                        </div>
                        {sel ? (
                          <div className="flex items-center gap-0.5 bg-white border border-sky-200 rounded-lg px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                            <button type="button" onClick={() => updateOptionConfigQty(option.id, Math.max(1, sel.defaultQuantity - 1))}
                              className="w-6 h-6 flex items-center justify-center text-sky-600 hover:bg-sky-50 rounded transition-colors font-medium">−</button>
                            <span className="text-sm font-bold text-sky-700 min-w-[20px] text-center">{sel.defaultQuantity}</span>
                            <button type="button" onClick={() => updateOptionConfigQty(option.id, sel.defaultQuantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-sky-600 hover:bg-sky-50 rounded transition-colors font-medium">+</button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-base">+</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Colonne gauche : sections du formulaire */}
          <div className="space-y-5">

        {/* ① Présentation & Matière */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader number="1" title="Présentation & Matière" color="emerald" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Nom du modèle <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="ex: Stop-rayon 70×210 rond" required />
            </div>
            {/* Toggle format 2D / 3D — masqué en mode multi-éléments (chaque élément a son propre toggle) */}
            {!isMultiElementMode && (
              <div className="md:col-span-2 space-y-3">
                <Label>Type de format</Label>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
                  <button type="button" onClick={() => set('formatType', '2d')}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.formatType === '2d'
                        ? 'bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                    À plat — L × H
                  </button>
                  <button type="button" onClick={() => set('formatType', '3d')}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.formatType === '3d'
                        ? 'bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                    Fini 3D — L × P × H
                  </button>
                </div>
              </div>
            )}

            {isMultiElementMode ? (
              /* ── Mode multi-produits : onglets identiques au calculateur ── */
              <div className="md:col-span-2 space-y-3">
                {/* Onglets */}
                <div className="flex gap-2 flex-wrap items-center">
                  {selectedElements.map((se) => {
                    const elName = typeElements.find((e) => e.id === se.elementId)?.name ?? `Élément ${se.elementId}`
                    const isActive = (activeElementId ?? selectedElements[0]?.elementId) === se.elementId
                    const group = amalgameGroups.find((g) => g.id === se.amalgameGroupId)
                    const groupColor = group ? GROUP_COLORS[group.colorIndex % GROUP_COLORS.length] : null
                    return (
                      <button
                        key={se.elementId}
                        type="button"
                        onClick={() => setActiveElementId(se.elementId)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                          isActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {groupColor && (
                          <span className={`w-2 h-2 rounded-full ${groupColor.dot} shrink-0`} />
                        )}
                        {elName}
                        {se.flatWidth && se.flatHeight ? (
                          <span className="text-xs font-normal opacity-60">{se.flatWidth}×{se.flatHeight}</span>
                        ) : null}
                      </button>
                    )
                  })}
                  <div className="ml-auto">
                    {amalgameGroups.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setEditingGroupId('new')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Amalgamer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingGroupId('new')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter un amalgame
                      </button>
                    )}
                  </div>
                </div>
                {/* Groupes d'amalgame existants */}
                {amalgameGroups.length > 0 && (
                  <div className="space-y-2">
                    {amalgameGroups.map((group) => {
                      const color = GROUP_COLORS[group.colorIndex % GROUP_COLORS.length]
                      const memberNames = selectedElements
                        .filter((se) => se.amalgameGroupId === group.id)
                        .map((se) => typeElements.find((e) => e.id === se.elementId)?.name ?? `Élément ${se.elementId}`)
                      return (
                        <div key={group.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${group.amalgameType === 'impression_decoupe' ? 'border-violet-200 bg-violet-50/40' : 'border-orange-200 bg-orange-50/40'}`}>
                          <span className={`w-3 h-3 rounded-full ${color.dot} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-700">{group.name}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            <span className="text-xs text-slate-500">{group.amalgameType === 'impression_decoupe' ? 'Impression + Découpe' : 'Découpe'}</span>
                            {memberNames.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {memberNames.map((n) => (
                                  <span key={n} className={`text-xs px-1.5 py-0.5 rounded border ${color.badge}`}>{n}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => setEditingGroupId(group.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => handleAmalgameDelete(group.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Éditeur de groupe (création ou édition) */}
                {editingGroupId !== null && (
                  <GroupEditor
                    initial={editingGroupId === 'new' ? undefined : amalgameGroups.find((g) => g.id === editingGroupId)}
                    products={elementsAsSlots}
                    plates={plates}
                    groupCount={amalgameGroups.length}
                    onSave={handleAmalgameSave}
                    onCancel={() => setEditingGroupId(null)}
                  />
                )}

                {/* Contenu de l'élément actif */}
                {activeEl && (() => {
                  const elId = activeEl.elementId
                  const upd = <K extends keyof TemplateElementEntry>(f: K, v: TemplateElementEntry[K]) => updateElement(elId, f, v)
                  const activeFlatDimensions = getFlatDimensions(activeEl.flatWidth, activeEl.flatDepth, activeEl.flatHeight, activeEl.formatType)
                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">

                      {/* Matière */}
                      <div className="space-y-2">
                        <Label>Matière</Label>
                        <select
                          value={activeEl.plateId?.toString() ?? ''}
                          onChange={(e) => upd('plateId', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Choisir une matière...</option>
                          {plates.map((p) => (
                            <option key={p.id} value={p.id.toString()}>{p.name} — {p.cost.toFixed(2)} €/pl.</option>
                          ))}
                        </select>
                      </div>

                      {/* Format */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{activeEl.formatType === '3d' ? 'Format fini (mm)' : 'Format à plat (mm)'}</Label>
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            <button type="button" onClick={() => { upd('formatType', '2d'); upd('flatDepth', null) }}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeEl.formatType === '2d' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}>
                              À plat
                            </button>
                            <button type="button" onClick={() => upd('formatType', '3d')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeEl.formatType === '3d' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}>
                              3D
                            </button>
                          </div>
                        </div>
                        <div className={`grid gap-2 ${activeEl.formatType === '3d' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                          <input type="number" min={1} value={activeEl.flatWidth ?? ''} onChange={(e) => upd('flatWidth', parseInt(e.target.value) || null)} placeholder="Largeur" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                          {activeEl.formatType === '3d' && (
                            <input type="number" min={1} value={activeEl.flatDepth ?? ''} onChange={(e) => upd('flatDepth', parseInt(e.target.value) || null)} placeholder="Prof." className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                          )}
                          <input type="number" min={1} value={activeEl.flatHeight ?? ''} onChange={(e) => upd('flatHeight', parseInt(e.target.value) || null)} placeholder="Hauteur" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                        </div>
                        {activeEl.formatType === '3d' && (
                          <div className={`rounded-lg border px-3 py-2 text-sm ${
                            activeFlatDimensions.width && activeFlatDimensions.height
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          }`}>
                            {activeFlatDimensions.width && activeFlatDimensions.height
                              ? <>À plat calculé : <strong>{activeFlatDimensions.width} × {activeFlatDimensions.height} mm</strong></>
                              : <>À plat calculé dès que Largeur, Profondeur et Hauteur sont renseignées.</>}
                          </div>
                        )}
                      </div>

                      {/* Impression */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">Impression</h4>
                          <ToggleChip active={activeEl.hasImpression} onClick={() => upd('hasImpression', !activeEl.hasImpression)}>
                            {activeEl.hasImpression ? 'Activée' : 'Désactivée'}
                          </ToggleChip>
                        </div>
                        {activeEl.hasImpression && (
                          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="flex gap-2 bg-white p-1 rounded-lg">
                              <button type="button" onClick={() => upd('printMode', 'production')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeEl.printMode === 'production' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Production</button>
                              <button type="button" onClick={() => upd('printMode', 'quality')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeEl.printMode === 'quality' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Qualité</button>
                            </div>
                            <div className="flex gap-2 bg-white p-1 rounded-lg">
                              <button type="button" onClick={() => { upd('isRectoVerso', false); upd('rectoVersoType', null) }} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!activeEl.isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Recto seul</button>
                              <button type="button" onClick={() => upd('isRectoVerso', true)} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeEl.isRectoVerso ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Recto / Verso</button>
                            </div>
                            {activeEl.isRectoVerso && (
                              <div className="flex gap-2 bg-white p-1 rounded-lg">
                                <button type="button" onClick={() => upd('rectoVersoType', 'identical')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeEl.rectoVersoType === 'identical' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Identique</button>
                                <button type="button" onClick={() => upd('rectoVersoType', 'different')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeEl.rectoVersoType === 'different' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Différent</button>
                              </div>
                            )}
                            {activeEl.rectoVersoType === 'different' ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <GaugeSlider label="Encre Recto (ml/plaque)" value={activeEl.inkMlPerPlate} min={0} max={100} unit="ml" onChange={(v) => upd('inkMlPerPlate', v)} gradientColors="from-indigo-300 to-purple-600" />
                                  <div className="flex gap-2">{INK_SHORTCUTS.map((v) => <button key={v} type="button" onClick={() => upd('inkMlPerPlate', v)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeEl.inkMlPerPlate === v ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{v} ml</button>)}</div>
                                </div>
                                <div className="space-y-2">
                                  <GaugeSlider label="Encre Verso (ml/plaque)" value={activeEl.inkMlVerso} min={0} max={100} unit="ml" onChange={(v) => upd('inkMlVerso', v)} gradientColors="from-violet-300 to-fuchsia-600" />
                                  <div className="flex gap-2">{INK_SHORTCUTS.map((v) => <button key={v} type="button" onClick={() => upd('inkMlVerso', v)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeEl.inkMlVerso === v ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{v} ml</button>)}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <GaugeSlider label="Encre (ml/plaque)" value={activeEl.inkMlPerPlate} min={0} max={100} unit="ml" onChange={(v) => upd('inkMlPerPlate', v)} gradientColors="from-indigo-300 to-purple-600" />
                                <div className="flex gap-2">{INK_SHORTCUTS.map((v) => <button key={v} type="button" onClick={() => upd('inkMlPerPlate', v)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeEl.inkMlPerPlate === v ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{v} ml</button>)}</div>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label className="text-xs text-purple-800">Finitions</Label>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => upd('hasVarnish', !activeEl.hasVarnish)} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${activeEl.hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Vernis</button>
                                <button type="button" onClick={() => upd('hasFlatColor', !activeEl.hasFlatColor)} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${activeEl.hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Blanc</button>
                              </div>
                              {activeEl.hasVarnish && (
                                <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                                  <GaugeSlider label="Surface Vernis" value={activeEl.varnishSurfacePercent} min={0} max={100} unit="%" onChange={(v) => upd('varnishSurfacePercent', v)} gradientColors="from-purple-200 to-purple-500" />
                                  <div className="flex gap-2">{FINISHING_SHORTCUTS.map((v) => <button key={v} type="button" onClick={() => upd('varnishSurfacePercent', v)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeEl.varnishSurfacePercent === v ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{v}%</button>)}</div>
                                </div>
                              )}
                              {activeEl.hasFlatColor && (
                                <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-100">
                                  <GaugeSlider label="Surface Aplat" value={activeEl.flatColorSurfacePercent} min={0} max={100} unit="%" onChange={(v) => upd('flatColorSurfacePercent', v)} gradientColors="from-violet-200 to-violet-500" />
                                  <div className="flex gap-2">{FINISHING_SHORTCUTS.map((v) => <button key={v} type="button" onClick={() => upd('flatColorSurfacePercent', v)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeEl.flatColorSurfacePercent === v ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{v}%</button>)}</div>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-purple-900 font-medium text-xs">Calage impression</Label>
                              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                {(['none', 'standard', 'complexe'] as const).map((t) => (
                                  <button key={t} type="button" onClick={() => upd('printSetupType', t)} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeEl.printSetupType === t ? (t === 'none' ? 'bg-white text-slate-700 shadow-sm' : t === 'standard' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-red-700 shadow-sm') : 'text-slate-400 hover:bg-slate-50'}`}>
                                    {t === 'none' ? 'Aucun' : t.charAt(0).toUpperCase() + t.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Découpe */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-700">Découpe</h4>
                        <div className="space-y-2">
                          <GaugeSlider label="Temps par pose" value={activeEl.cuttingTimePerPoseSeconds} min={0} max={300} unit="sec" onChange={(v) => upd('cuttingTimePerPoseSeconds', v)} formatValue={formatTimeSeconds} gradientColors="from-yellow-300 to-orange-600" />
                          <div className="flex gap-2">{CUTTING_SHORTCUTS.map((v) => <button key={v} type="button" onClick={() => upd('cuttingTimePerPoseSeconds', v)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeEl.cuttingTimePerPoseSeconds === v ? 'bg-orange-500 text-white border-orange-500' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{v === 0 ? '0s' : formatTimeSeconds(v)}</button>)}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-orange-900 font-medium text-xs">Calage découpe</Label>
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {(['none', 'standard', 'complexe'] as const).map((t) => (
                              <button key={t} type="button" onClick={() => upd('cuttingSetupType', t)} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeEl.cuttingSetupType === t ? (t === 'none' ? 'bg-white text-slate-700 shadow-sm' : t === 'standard' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-red-700 shadow-sm') : 'text-slate-400 hover:bg-slate-50'}`}>
                                {t === 'none' ? 'Aucun' : t.charAt(0).toUpperCase() + t.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )
                })()}
              </div>
            ) : form.formatType === '2d' ? (
              <>
                <div className="space-y-2">
                  <Label>Largeur à plat (mm)</Label>
                  <Input type="number" value={form.flatWidth ?? ''} onChange={(e) => set('flatWidth', parseInt(e.target.value) || null)} placeholder="ex: 70" />
                </div>
                <div className="space-y-2">
                  <Label>Hauteur à plat (mm)</Label>
                  <Input type="number" value={form.flatHeight ?? ''} onChange={(e) => set('flatHeight', parseInt(e.target.value) || null)} placeholder="ex: 210" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Largeur finie (mm)</Label>
                  <Input type="number" value={form.flatWidth ?? ''} onChange={(e) => set('flatWidth', parseInt(e.target.value) || null)} placeholder="ex: 400" />
                </div>
                <div className="space-y-2">
                  <Label>Profondeur finie (mm)</Label>
                  <Input type="number" value={form.flatDepth ?? ''} onChange={(e) => set('flatDepth', parseInt(e.target.value) || null)} placeholder="ex: 50" />
                </div>
                <div className="space-y-2">
                  <Label>Hauteur finie (mm)</Label>
                  <Input type="number" value={form.flatHeight ?? ''} onChange={(e) => set('flatHeight', parseInt(e.target.value) || null)} placeholder="ex: 1700" />
                </div>
                <div className="md:col-span-2">
                  <div className={`rounded-lg border px-3 py-2 text-sm ${
                    templateFlatDimensions.width && templateFlatDimensions.height
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}>
                    {templateFlatDimensions.width && templateFlatDimensions.height
                      ? <>À plat calculé pour la plaque : <strong>{templateFlatDimensions.width} × {templateFlatDimensions.height} mm</strong></>
                      : <>À plat calculé dès que Largeur, Profondeur et Hauteur sont renseignées.</>}
                    <span className="block text-xs opacity-75 mt-1">
                      Formules : largeur = {displayFlatWidthFormula}, hauteur = {displayFlatHeightFormula}
                    </span>
                  </div>
                </div>
              </>
            )}
            {!isMultiElementMode && (
              <div className="md:col-span-2 space-y-2">
                <Label>Matière par défaut</Label>
                <Select value={form.plateId?.toString() ?? 'none'} onValueChange={(v) => set('plateId', v === 'none' ? null : parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Aucune matière par défaut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {plates.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} — {p.cost.toFixed(2)} €/pl.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* ② Impression */}
        {!isMultiElementMode && <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader number="2" title="Impression" color="blue" />
            <ToggleChip active={form.hasImpression} onClick={() => set('hasImpression', !form.hasImpression)}>
              {form.hasImpression ? 'Activée' : 'Désactivée'}
            </ToggleChip>
          </div>
          {form.hasImpression && (
            <div className="space-y-4">

              {/* Calage impression */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Calage impression</Label>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                  <button type="button" onClick={() => set('printSetupType', 'none')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.printSetupType === 'none'
                        ? 'bg-white shadow-sm text-slate-700 ring-1 ring-slate-200'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                    Aucun
                  </button>
                  <button type="button" onClick={() => set('printSetupType', 'standard')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.printSetupType === 'standard'
                        ? 'bg-white shadow-sm text-amber-700 ring-1 ring-amber-200'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                    Standard
                  </button>
                  <button type="button" onClick={() => set('printSetupType', 'complexe')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.printSetupType === 'complexe'
                        ? 'bg-white shadow-sm text-red-700 ring-1 ring-red-200'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}>
                    Complexe
                  </button>
                </div>
                {form.printSetupType !== 'none' && (
                  <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                    form.printSetupType === 'standard' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    + {form.printSetupType === 'standard' ? '15' : '25'} € forfait {form.printSetupType}
                  </div>
                )}
              </div>

              {/* Mode impression */}
              <div className="space-y-2">
                <Label>Mode d&apos;Impression</Label>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                  <button type="button" onClick={() => set('printMode', 'production')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.printMode === 'production'
                        ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}>
                    Production
                  </button>
                  <button type="button" onClick={() => set('printMode', 'quality')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.printMode === 'quality'
                        ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}>
                    Qualité
                  </button>
                </div>
              </div>

              {/* Type impression */}
              <div className="space-y-2">
                <Label>Type d&apos;Impression</Label>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                  <button type="button" onClick={() => { set('isRectoVerso', false); set('rectoVersoType', null) }}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      !form.isRectoVerso
                        ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}>
                    Recto Seul
                  </button>
                  <button type="button" onClick={() => set('isRectoVerso', true)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      form.isRectoVerso
                        ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}>
                    Recto / Verso
                  </button>
                </div>
              </div>

              {form.isRectoVerso && (
                <div>
                  <Label className="mb-2 block">Visuel Recto / Verso</Label>
                  <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                    <button type="button" onClick={() => set('rectoVersoType', 'identical')}
                      className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        form.rectoVersoType === 'identical'
                          ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}>
                      Identique
                    </button>
                    <button type="button" onClick={() => set('rectoVersoType', 'different')}
                      className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        form.rectoVersoType === 'different'
                          ? 'bg-white shadow-sm text-purple-700 ring-1 ring-purple-100'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}>
                      Différent
                    </button>
                  </div>
                </div>
              )}

              {/* Encre */}
              {form.rectoVersoType === 'different' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <GaugeSlider label="Encre Recto (ml / plaque)" value={form.inkMlPerPlate}
                      max={100} min={0} unit="ml" onChange={(v) => set('inkMlPerPlate', v)}
                      gradientColors="from-indigo-300 to-purple-600" />
                    <div className="flex gap-2">
                      {INK_SHORTCUTS.map((val) => (
                        <button key={val} type="button" onClick={() => set('inkMlPerPlate', val)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            form.inkMlPerPlate === val
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}>
                          {val} ml
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <GaugeSlider label="Encre Verso (ml / plaque)" value={form.inkMlVerso}
                      max={100} min={0} unit="ml" onChange={(v) => set('inkMlVerso', v)}
                      gradientColors="from-violet-300 to-fuchsia-600" />
                    <div className="flex gap-2">
                      {INK_SHORTCUTS.map((val) => (
                        <button key={val} type="button" onClick={() => set('inkMlVerso', val)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            form.inkMlVerso === val
                              ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                              : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}>
                          {val} ml
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <GaugeSlider label="Encre (ml / plaque)" value={form.inkMlPerPlate}
                    max={100} min={0} unit="ml" onChange={(v) => set('inkMlPerPlate', v)}
                    gradientColors="from-indigo-300 to-purple-600" />
                  <div className="flex gap-2">
                    {INK_SHORTCUTS.map((val) => (
                      <button key={val} type="button" onClick={() => set('inkMlPerPlate', val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          form.inkMlPerPlate === val
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {val} ml
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finitions */}
              <div>
                <Label className="mb-2 block">Finitions</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => set('hasVarnish', !form.hasVarnish)}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      form.hasVarnish ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}>
                    Vernis
                  </button>
                  <button type="button" onClick={() => set('hasFlatColor', !form.hasFlatColor)}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      form.hasFlatColor ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}>
                    Blanc
                  </button>
                </div>

                {form.hasVarnish && (
                  <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <GaugeSlider label="Surface Vernis" value={form.varnishSurfacePercent}
                      max={100} min={0} unit="%" onChange={(v) => set('varnishSurfacePercent', v)}
                      gradientColors="from-purple-200 to-purple-500" />
                    <div className="flex gap-2">
                      {FINISHING_SHORTCUTS.map((val) => (
                        <button key={val} type="button" onClick={() => set('varnishSurfacePercent', val)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            form.varnishSurfacePercent === val
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}>
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.hasFlatColor && (
                  <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <GaugeSlider label="Surface Blanc" value={form.flatColorSurfacePercent}
                      max={100} min={0} unit="%" onChange={(v) => set('flatColorSurfacePercent', v)}
                      gradientColors="from-violet-200 to-violet-500" />
                    <div className="flex gap-2">
                      {FINISHING_SHORTCUTS.map((val) => (
                        <button key={val} type="button" onClick={() => set('flatColorSurfacePercent', val)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            form.flatColorSurfacePercent === val
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}>
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(form.hasVarnish || form.hasFlatColor) && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Encre standard</span>
                      <span className="font-semibold">100%</span>
                    </div>
                    {form.hasVarnish && (
                      <div className="flex justify-between text-purple-700">
                        <span>Vernis (120 €/L)</span>
                        <span className="font-semibold">{form.varnishSurfacePercent}%</span>
                      </div>
                    )}
                    {form.hasFlatColor && (
                      <div className="flex justify-between text-violet-700">
                        <span>Blanc (120 €/L)</span>
                        <span className="font-semibold">{form.flatColorSurfacePercent}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Temps machine pour 1 plaque */}
              {(() => {
                const plate = plates.find((p) => p.id === form.plateId)
                if (!plate) return (
                  <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-xs text-purple-800">
                    <span>Temps machine / plaque :</span>
                    <span className="text-purple-400 italic">matière non définie</span>
                  </div>
                )
                const areaM2 = (plate.width * plate.height) / 1_000_000
                const pace = form.printMode === 'production' ? 1 : 2
                const mult = form.isRectoVerso ? 2 : 1
                const t = areaM2 * pace * mult
                  + (form.hasVarnish ? areaM2 * 1.5 * mult : 0)
                  + (form.hasFlatColor ? areaM2 * 1.5 * mult : 0)
                return (
                  <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-xs text-purple-800">
                    <span>Temps machine / plaque :</span>
                    <span className="font-bold text-sm">{formatMinutes(t)}</span>
                  </div>
                )
              })()}

            </div>
          )}
        </div>}

        {/* ③ Découpe */}
        {!isMultiElementMode && <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4 [&>div]:mb-0">
            <SectionHeader number="3" title="Découpe" color="violet" />
            {false && (
              <span className="text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
                Commune à tous les éléments
              </span>
            )}
          </div>
          <div className="space-y-4">

            {/* Calage découpe */}
            <div className="space-y-2">
              <Label className="text-orange-900 font-medium">Calage découpe</Label>
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                <button type="button" onClick={() => set('cuttingSetupType', 'none')}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    form.cuttingSetupType === 'none'
                      ? 'bg-white shadow-sm text-slate-700 ring-1 ring-slate-200'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}>Aucun</button>
                <button type="button" onClick={() => set('cuttingSetupType', 'standard')}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    form.cuttingSetupType === 'standard'
                      ? 'bg-white shadow-sm text-amber-700 ring-1 ring-amber-200'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}>Standard</button>
                <button type="button" onClick={() => set('cuttingSetupType', 'complexe')}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    form.cuttingSetupType === 'complexe'
                      ? 'bg-white shadow-sm text-red-700 ring-1 ring-red-200'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}>Complexe</button>
              </div>
              {form.cuttingSetupType !== 'none' && (
                <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  form.cuttingSetupType === 'standard' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>
                  + {form.cuttingSetupType === 'standard' ? '15' : '25'} € forfait {form.cuttingSetupType}
                </div>
              )}
            </div>

            {/* Temps par pose */}
            <div className="space-y-2">
              <GaugeSlider label="Temps par Pose" value={form.cuttingTimePerPoseSeconds}
                min={0} max={300} unit="sec" onChange={(v) => set('cuttingTimePerPoseSeconds', v)}
                formatValue={formatTimeSeconds} gradientColors="from-yellow-300 to-orange-600" />
              <div className="flex gap-2">
                {CUTTING_SHORTCUTS.map((val) => (
                  <button key={val} type="button" onClick={() => set('cuttingTimePerPoseSeconds', val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      form.cuttingTimePerPoseSeconds === val
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}>
                    {formatTimeSeconds(val)}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>}

        {/* ④ Façonnage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader number="4" title="Façonnage" color="orange" />
            <ToggleChip active={form.hasFaconnage} onClick={() => set('hasFaconnage', !form.hasFaconnage)}>
              {form.hasFaconnage ? 'Activé' : 'Désactivé'}
            </ToggleChip>
          </div>
          {form.hasFaconnage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <GaugeSlider label="Temps par Pièce" value={form.assemblyTimePerPieceSeconds}
                  min={0} max={300} unit="sec" onChange={(v) => set('assemblyTimePerPieceSeconds', v)}
                  formatValue={formatTimeSeconds} gradientColors="from-pink-300 to-rose-600" />
                <div className="flex gap-2">
                  {ASSEMBLY_SHORTCUTS.map((val) => (
                    <button key={val} type="button" onClick={() => set('assemblyTimePerPieceSeconds', val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        form.assemblyTimePerPieceSeconds === val
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}>
                      {formatTimeSeconds(val)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ⑤ Conditionnement */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader number="5" title="Conditionnement" color="pink" />
            <ToggleChip active={form.hasConditionnement} onClick={() => set('hasConditionnement', !form.hasConditionnement)}>
              {form.hasConditionnement ? 'Activé' : 'Désactivé'}
            </ToggleChip>
          </div>
          {form.hasConditionnement && (
            <div className="space-y-4">
              <div className="space-y-2">
                <GaugeSlider label="Temps par Pièce" value={form.packTimePerPieceSeconds}
                  min={0} max={300} unit="sec" onChange={(v) => set('packTimePerPieceSeconds', v)}
                  formatValue={formatTimeSeconds} gradientColors="from-teal-300 to-emerald-600" />
                <div className="flex gap-2">
                  {PACK_SHORTCUTS.map((val) => (
                    <button key={val} type="button" onClick={() => set('packTimePerPieceSeconds', val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        form.packTimePerPieceSeconds === val
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}>
                      {formatTimeSeconds(val)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-teal-50 p-3 rounded-lg border border-teal-100">
                <input type="checkbox" id="assemblyNotice" checked={form.hasAssemblyNotice}
                  onChange={(e) => set('hasAssemblyNotice', e.target.checked)}
                  className="h-5 w-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                <Label htmlFor="assemblyNotice" className="text-teal-900 cursor-pointer font-medium">
                  Ajouter Notice de Montage (+0.10€ / pce)
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* ⑥ Accessoires */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader number="6" title="Accessoires" color="teal" />
            <ToggleChip active={form.hasAccessoires} onClick={() => set('hasAccessoires', !form.hasAccessoires)}>
              {form.hasAccessoires ? 'Activés' : 'Désactivés'}
            </ToggleChip>
          </div>
          {form.hasAccessoires && (
            <div className="space-y-4">
              {/* Sélecteur */}
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Accessoire</Label>
                  <Select value={currentAccessoryId || 'none'} onValueChange={(v) => setCurrentAccessoryId(v === 'none' ? '' : v)}
                    disabled={accessories.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={accessories.length === 0 ? 'Aucun accessoire disponible' : 'Choisir...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Choisir —</SelectItem>
                      {accessories.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name} ({a.price.toFixed(2)} €)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qté</Label>
                  <Input type="number" value={currentQty || ''}
                    onChange={(e) => setCurrentQty(parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
                <Button type="button" onClick={handleAddAccessory}
                  disabled={!currentAccessoryId || currentQty <= 0}
                  className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Créer un accessoire */}
              {!showCreateAcc ? (
                <button type="button" onClick={() => setShowCreateAcc(true)}
                  className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium">
                  <PlusCircle className="h-4 w-4" /> Créer un nouvel accessoire
                </button>
              ) : (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-3">
                  <div className="text-sm font-medium text-teal-800">Nouvel accessoire</div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Nom</Label>
                      <Input value={newAccName} onChange={(e) => setNewAccName(e.target.value)}
                        placeholder="Ex: Vis M4" className="h-8 text-sm" />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Prix (€)</Label>
                      <Input type="number" step="0.01" value={newAccPrice}
                        onChange={(e) => setNewAccPrice(e.target.value)}
                        placeholder="0.00" className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" type="button"
                      onClick={() => { setShowCreateAcc(false); setNewAccName(''); setNewAccPrice('') }}>
                      Annuler
                    </Button>
                    <Button size="sm" type="button" onClick={handleCreateAccessory}
                      disabled={isCreatingAcc || !newAccName.trim() || !newAccPrice || parseFloat(newAccPrice) <= 0}
                      className="bg-teal-600 hover:bg-teal-700">
                      {isCreatingAcc ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Liste sélectionnés */}
              {selectedAccessories.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                  {selectedAccessories.map((item) => (
                    <div key={item.accessoryId} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700">{item.quantity} x {item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{(item.price * item.quantity).toFixed(2)} €</span>
                        <button type="button" onClick={() => handleRemoveAccessory(item.accessoryId)}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-end text-sm font-bold text-teal-700">
                    Total Accessoires: {selectedAccessories.reduce((s, a) => s + a.price * a.quantity, 0).toFixed(2)} €
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


          </div>{/* fin colonne gauche */}

          {/* Colonne droite : panneau sticky */}
          <div className="space-y-4 xl:sticky xl:top-6">
            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">Notes internes</h3>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                placeholder="Notes, contraintes particulières…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-300"
              />
            </div>
            {/* Actions */}
            <div className="space-y-2">
              <Button type="submit" disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" />
                {isPending ? 'Enregistrement...' : initialData?.id ? 'Mettre à jour' : 'Créer le modèle'}
              </Button>
              <Link href={`/dashboard/products/${productTypeId}`} className="block">
                <Button type="button" variant="outline" className="w-full">Annuler</Button>
              </Link>
            </div>
          </div>

        </div>{/* fin grid */}
      </form>
    </div>
  )
}
