'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, PlusCircle, Trash2 } from 'lucide-react'
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

// ── Types ──────────────────────────────────────────────────────────────────

type Plate = { id: number; name: string; width: number; height: number; cost: number; material: string }
type AccessoryItem = { id: number; name: string; price: number }
type SelectedAccessory = { accessoryId: number; name: string; price: number; quantity: number }

type TemplateFormData = {
  id?: number
  productTypeId: number
  name: string
  flatWidth: number | null
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
  hasTransport: boolean
  defaultTransportMode: 'PACK30' | 'MESSAGERIE_PLUS' | 'AFFRETEMENT' | null
  // Notes
  notes: string
}

type Props = {
  productTypeId: number
  productTypeName: string
  plates: Plate[]
  allAccessories: AccessoryItem[]
  initialData?: Partial<TemplateFormData>
  initialAccessories?: SelectedAccessory[]
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

export default function TemplateForm({ productTypeId, productTypeName, plates, allAccessories, initialData, initialAccessories = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<TemplateFormData>({
    productTypeId,
    name: initialData?.name ?? '',
    flatWidth: initialData?.flatWidth ?? null,
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
    hasTransport: initialData?.hasTransport ?? false,
    defaultTransportMode: initialData?.defaultTransportMode ?? null,
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

  // ── Soumission ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    startTransition(async () => {
      try {
        const payload = { ...form, notes: form.notes || undefined }
        const accPayload = selectedAccessories.map((a) => ({ accessoryId: a.accessoryId, quantity: a.quantity }))
        if (initialData?.id) {
          await updateProductTemplate(initialData.id, payload, accPayload)
          toast.success('Modèle mis à jour')
        } else {
          await createProductTemplate(payload, accPayload)
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

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">

        {/* ① Présentation & Matière */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader number="1" title="Présentation & Matière" color="emerald" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Nom du modèle <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="ex: Stop-rayon 70×210 rond" required />
            </div>
            <div className="space-y-2">
              <Label>Largeur à plat (mm)</Label>
              <Input type="number" value={form.flatWidth ?? ''} onChange={(e) => set('flatWidth', parseInt(e.target.value) || null)} placeholder="ex: 70" />
            </div>
            <div className="space-y-2">
              <Label>Hauteur à plat (mm)</Label>
              <Input type="number" value={form.flatHeight ?? ''} onChange={(e) => set('flatHeight', parseInt(e.target.value) || null)} placeholder="ex: 210" />
            </div>
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
          </div>
        </div>

        {/* ② Impression */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
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
        </div>

        {/* ③ Découpe */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader number="3" title="Découpe" color="violet" />
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
        </div>

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

        {/* ⑦ Transport */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader number="7" title="Transport" color="sky" />
            <ToggleChip active={form.hasTransport} onClick={() => set('hasTransport', !form.hasTransport)}>
              {form.hasTransport ? 'Activé' : 'Désactivé'}
            </ToggleChip>
          </div>
          {form.hasTransport && (
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium text-sm">Mode d&apos;expédition par défaut</Label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: 'PACK30', label: 'Pack 30' },
                  { id: 'MESSAGERIE_PLUS', label: 'Messagerie Plus' },
                  { id: 'AFFRETEMENT', label: 'Affrètement' },
                ] as const).map((m) => (
                  <button key={m.id} type="button"
                    onClick={() => set('defaultTransportMode', form.defaultTransportMode === m.id ? null : m.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                      form.defaultTransportMode === m.id
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 italic">Le mode sélectionné sera pré-rempli dans le calculateur.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Enregistrement...' : initialData?.id ? 'Mettre à jour' : 'Créer le modèle'}
          </Button>
          <Link href={`/dashboard/products/${productTypeId}`}>
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
