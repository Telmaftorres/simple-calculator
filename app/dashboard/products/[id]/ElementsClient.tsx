'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ArrowLeft, LayoutTemplate, Layers, Settings2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createElement,
  updateElement,
  deleteElement,
  deleteProductTemplate,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  createProductOptionVariant,
  updateProductOptionVariant,
  deleteProductOptionVariant,
} from '@/app/actions/catalog'
import Link from 'next/link'

type Element = {
  id: number
  name: string
  quantity: number
}

type Template = {
  id: number
  name: string
  formatType: string
  flatWidth: number | null
  flatDepth: number | null
  flatHeight: number | null
  cuttingTimePerPoseSeconds: number
  hasFaconnage: boolean
  hasAccessoires: boolean
  hasConditionnement: boolean
  notes: string | null
  plate: { id: number; name: string; material: string } | null
}

type ProductOptionVariant = {
  id: number
  label: string
  priceHT: number | null
  position: number
}

type ProductOption = {
  id: number
  name: string
  inputType: string
  priceHT: number | null
  position: number
  variants: ProductOptionVariant[]
}

type ProductType = {
  id: number
  name: string
  elements: Element[]
  templates: Template[]
  options: ProductOption[]
}

const INPUT_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Choix unique',
  multi_item: 'Ajout multiple',
}

export default function ElementsClient({ product }: { product: ProductType }) {
  const [activeTab, setActiveTab] = useState<'elements' | 'templates' | 'options'>('templates')

  // ── Elements state ──
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false)
  const [editingElement, setEditingElement] = useState<Element | null>(null)
  const [formData, setFormData] = useState({ name: '', quantity: '1' })

  const resetForm = () => {
    setFormData({ name: '', quantity: '1' })
    setEditingElement(null)
  }

  const handleOpenElementDialog = (element?: Element) => {
    if (element) {
      setEditingElement(element)
      setFormData({ name: element.name, quantity: element.quantity.toString() })
    } else {
      resetForm()
    }
    setIsElementDialogOpen(true)
  }

  const handleSubmitElement = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: formData.name, quantity: parseInt(formData.quantity) || 1 }
    try {
      if (editingElement) {
        await updateElement(editingElement.id, product.id, payload)
      } else {
        await createElement({ productTypeId: product.id, ...payload })
      }
      setIsElementDialogOpen(false)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteElement = async (id: number) => {
    if (confirm('Supprimer cet élément ?')) {
      await deleteElement(id, product.id)
    }
  }

  // ── Templates ──
  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Supprimer ce modèle standard ?')) return
    try {
      await deleteProductTemplate(id)
      toast.success('Modèle supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // ── Options state ──
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())

  // Dialog: option
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)
  const [optionForm, setOptionForm] = useState({ name: '', inputType: 'single_choice', priceHT: '' })

  // Dialog: variant
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false)
  const [variantParentOptionId, setVariantParentOptionId] = useState<number | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductOptionVariant | null>(null)
  const [variantForm, setVariantForm] = useState({ label: '', priceHT: '' })

  const toggleOption = (id: number) => {
    setExpandedOptions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleOpenOptionDialog = (option?: ProductOption) => {
    if (option) {
      setEditingOption(option)
      setOptionForm({
        name: option.name,
        inputType: option.inputType,
        priceHT: option.priceHT != null ? option.priceHT.toString() : '',
      })
    } else {
      setEditingOption(null)
      setOptionForm({ name: '', inputType: 'single_choice', priceHT: '' })
    }
    setIsOptionDialogOpen(true)
  }

  const handleSubmitOption = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      productTypeId: product.id,
      name: optionForm.name,
      inputType: optionForm.inputType as 'single_choice' | 'multi_item',
      priceHT: optionForm.priceHT !== '' ? parseFloat(optionForm.priceHT) : null,
    }
    try {
      if (editingOption) {
        await updateProductOption(editingOption.id, payload)
      } else {
        await createProductOption(payload)
      }
      setIsOptionDialogOpen(false)
      toast.success(editingOption ? 'Option modifiée' : 'Option créée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteOption = async (id: number) => {
    if (!confirm('Supprimer cette option et toutes ses variantes ?')) return
    try {
      await deleteProductOption(id)
      toast.success('Option supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleOpenVariantDialog = (optionId: number, variant?: ProductOptionVariant) => {
    setVariantParentOptionId(optionId)
    if (variant) {
      setEditingVariant(variant)
      setVariantForm({ label: variant.label, priceHT: variant.priceHT != null ? variant.priceHT.toString() : '' })
    } else {
      setEditingVariant(null)
      setVariantForm({ label: '', priceHT: '' })
    }
    setIsVariantDialogOpen(true)
  }

  const handleSubmitVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceHT = variantForm.priceHT !== '' ? parseFloat(variantForm.priceHT) : null
    try {
      if (editingVariant) {
        await updateProductOptionVariant(editingVariant.id, { label: variantForm.label, priceHT })
      } else if (variantParentOptionId) {
        await createProductOptionVariant({ optionId: variantParentOptionId, label: variantForm.label, priceHT })
      }
      setIsVariantDialogOpen(false)
      toast.success(editingVariant ? 'Variante modifiée' : 'Variante ajoutée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Supprimer cette variante ?')) return
    try {
      await deleteProductOptionVariant(id)
      toast.success('Variante supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
          <p className="text-slate-500 text-sm">Gérer les éléments, les modèles standards et les options</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-emerald-500 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutTemplate className="h-4 w-4" />
          Modèles standards
          {product.templates.length > 0 && (
            <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs rounded-full px-2 py-0.5">
              {product.templates.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'options'
              ? 'border-violet-500 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          Options
          {product.options.length > 0 && (
            <span className="ml-1 bg-violet-100 text-violet-700 text-xs rounded-full px-2 py-0.5">
              {product.options.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('elements')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'elements'
              ? 'border-slate-500 text-slate-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          Éléments composants
          {product.elements.length > 0 && (
            <span className="ml-1 bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5">
              {product.elements.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Modèles standards ── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/dashboard/products/${product.id}/templates/new`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Créer un modèle standard
              </Button>
            </Link>
          </div>

          {product.templates.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-slate-200 p-12 text-center">
              <LayoutTemplate className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucun modèle standard</p>
              <p className="text-slate-400 text-sm mt-1">
                Les modèles permettent de pré-remplir le calculateur pour les produits récurrents.
              </p>
              <Link href={`/dashboard/products/${product.id}/templates/new`}>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Créer le premier modèle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {product.templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between gap-4 hover:border-emerald-200 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="font-semibold text-slate-800">{tpl.name}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {tpl.flatWidth && tpl.flatHeight && (
                        <span>
                          Format : {tpl.formatType === '3d' && tpl.flatDepth
                            ? `${tpl.flatWidth}×${tpl.flatDepth}×${tpl.flatHeight} mm`
                            : `${tpl.flatWidth}×${tpl.flatHeight} mm`}
                        </span>
                      )}
                      {tpl.plate && (
                        <span>Matière : {tpl.plate.material}</span>
                      )}
                      {tpl.cuttingTimePerPoseSeconds > 0 && (
                        <span>Découpe : {tpl.cuttingTimePerPoseSeconds}s/pose</span>
                      )}
                      <span className={tpl.hasFaconnage ? 'text-emerald-600' : 'text-slate-400'}>
                        {tpl.hasFaconnage ? '✓ Façonnage' : '— Façonnage'}
                      </span>
                      <span className={tpl.hasAccessoires ? 'text-emerald-600' : 'text-slate-400'}>
                        {tpl.hasAccessoires ? '✓ Accessoires' : '— Accessoires'}
                      </span>
                      <span className={tpl.hasConditionnement ? 'text-emerald-600' : 'text-slate-400'}>
                        {tpl.hasConditionnement ? '✓ Conditionnement' : '— Conditionnement'}
                      </span>
                    </div>
                    {tpl.notes && (
                      <p className="text-xs text-slate-400 italic">{tpl.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/dashboard/products/${product.id}/templates/${tpl.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(tpl.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Options ── */}
      {activeTab === 'options' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => handleOpenOptionDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter une option
            </Button>
          </div>

          {product.options.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-slate-200 p-12 text-center">
              <Settings2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucune option définie</p>
              <p className="text-slate-400 text-sm mt-1">
                Les options permettent de configurer les variantes du produit (ex : type de pied, pop-up…)
              </p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenOptionDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Créer la première option
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {product.options.map((opt) => {
                const isExpanded = expandedOptions.has(opt.id)
                return (
                  <div key={opt.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {/* Option header */}
                    <div className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => toggleOption(opt.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />
                        }
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{opt.name}</span>
                          <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">
                            {INPUT_TYPE_LABELS[opt.inputType] ?? opt.inputType}
                          </span>
                          {opt.priceHT != null && (
                            <span className="text-xs text-slate-500">{opt.priceHT.toFixed(2)} € HT (base)</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {opt.variants.length === 0
                            ? 'Aucune variante'
                            : `${opt.variants.length} variante${opt.variants.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenVariantDialog(opt.id)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Variante
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenOptionDialog(opt)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteOption(opt.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Variants list */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50">
                        {opt.variants.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">
                            Aucune variante — cliquez sur &quot;+ Variante&quot; pour en ajouter.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs">Libellé</TableHead>
                                <TableHead className="text-xs text-right">Prix HT</TableHead>
                                <TableHead className="text-right" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {opt.variants.map((v) => (
                                <TableRow key={v.id} className="bg-white">
                                  <TableCell className="font-medium text-sm">{v.label}</TableCell>
                                  <TableCell className="text-right text-sm text-slate-500">
                                    {v.priceHT != null ? `${v.priceHT.toFixed(2)} €` : '—'}
                                  </TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenVariantDialog(opt.id, v)}>
                                      <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteVariant(v.id)}>
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Éléments composants ── */}
      {activeTab === 'elements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenElementDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un élément
            </Button>
          </div>

          <div className="bg-white rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de l&apos;élément</TableHead>
                  <TableHead className="text-right">Quantité par défaut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.elements.map((el) => (
                  <TableRow key={el.id}>
                    <TableCell className="font-medium">{el.name}</TableCell>
                    <TableCell className="text-right">{el.quantity}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenElementDialog(el)}>
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteElement(el.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {product.elements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      Aucun élément défini pour ce type.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog open={isElementDialogOpen} onOpenChange={setIsElementDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingElement ? "Modifier l'élément" : 'Ajouter un élément'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitElement} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="el-name">Nom</Label>
                  <Input
                    id="el-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Corps, Fronton, Socle..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="el-qty">Quantité</Label>
                  <Input
                    type="number"
                    id="el-qty"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ── Dialog: Option ── */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Modifier l'option" : 'Ajouter une option'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOption} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="opt-name">Nom de l&apos;option</Label>
              <Input
                id="opt-name"
                value={optionForm.name}
                onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                placeholder="ex: Pied, Pop-up, Tablette..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opt-type">Type de saisie</Label>
              <Select
                value={optionForm.inputType}
                onValueChange={(v) => setOptionForm({ ...optionForm, inputType: v })}
              >
                <SelectTrigger id="opt-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Choix unique — on sélectionne une seule variante</SelectItem>
                  <SelectItem value="multi_item">Ajout multiple — on peut en ajouter plusieurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opt-price">Prix de base HT (€) — optionnel</Label>
              <Input
                id="opt-price"
                type="number"
                step="0.01"
                min="0"
                value={optionForm.priceHT}
                onChange={(e) => setOptionForm({ ...optionForm, priceHT: e.target.value })}
                placeholder="Laisser vide si pas de prix"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Variant ── */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Modifier la variante' : 'Ajouter une variante'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitVariant} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="var-label">Libellé</Label>
              <Input
                id="var-label"
                value={variantForm.label}
                onChange={(e) => setVariantForm({ ...variantForm, label: e.target.value })}
                placeholder="ex: Pied cruciforme, Pop-up A4 paysage..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="var-price">Prix HT (€) — optionnel</Label>
              <Input
                id="var-price"
                type="number"
                step="0.01"
                min="0"
                value={variantForm.priceHT}
                onChange={(e) => setVariantForm({ ...variantForm, priceHT: e.target.value })}
                placeholder="Laisser vide si pas de prix"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
