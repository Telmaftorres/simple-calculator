'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
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
import { createElement, updateElement, deleteElement } from '@/app/actions/admin' // updateElement needs to be added to actions
import Link from 'next/link'

type Element = {
  id: number
  name: string
  quantity: number
}

type ProductType = {
  id: number
  name: string
  elements: Element[]
}

export default function ElementsClient({ product }: { product: ProductType }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingElement, setEditingElement] = useState<Element | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
  })

  const resetForm = () => {
    setFormData({ name: '', quantity: '1' })
    setEditingElement(null)
  }

  const handleOpenDialog = (element?: Element) => {
    if (element) {
      setEditingElement(element)
      setFormData({
        name: element.name,
        quantity: element.quantity.toString(),
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: formData.name,
      quantity: parseInt(formData.quantity) || 1,
    }

    try {
      if (editingElement) {
        // Need to add updateElement to actions/admin.ts
        await updateElement(editingElement.id, product.id, payload)
      } else {
        await createElement({
          productTypeId: product.id,
          ...payload,
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save element', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cet élément ?')) {
      await deleteElement(id, product.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
          <p className="text-slate-500">Gérer les éléments composants ce type de PLV</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un élément
          </Button>
        </div>
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
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(el)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(el.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingElement ? "Modifier l'élément" : 'Ajouter un élément'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
  )
}
