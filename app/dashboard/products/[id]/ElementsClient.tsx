'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ArrowLeft, LayoutTemplate, Layers } from 'lucide-react'
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
import { createElement, updateElement, deleteElement, deleteProductTemplate } from '@/app/actions/catalog'
import Link from 'next/link'

type Element = {
  id: number
  name: string
  quantity: number
}

type Template = {
  id: number
  name: string
  flatWidth: number | null
  flatHeight: number | null
  cuttingTimePerPoseSeconds: number
  hasFaconnage: boolean
  hasAccessoires: boolean
  hasConditionnement: boolean
  notes: string | null
  plate: { id: number; name: string; material: string } | null
}

type ProductType = {
  id: number
  name: string
  elements: Element[]
  templates: Template[]
}

export default function ElementsClient({ product }: { product: ProductType }) {
  const [activeTab, setActiveTab] = useState<'elements' | 'templates'>('templates')

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
          <p className="text-slate-500 text-sm">Gérer les éléments et les modèles standards</p>
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
                        <span>Format : {tpl.flatWidth}×{tpl.flatHeight} mm</span>
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
    </div>
  )
}
