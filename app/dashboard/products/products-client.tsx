'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, List } from 'lucide-react'
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
import { createProductType, updateProductType, deleteProductType } from '@/app/actions/admin'
import Link from 'next/link'

type Element = {
  id: number
  name: string
  quantity: number
}

type ProductType = {
  id: number
  name: string
  flatWidthFormula: string
  flatHeightFormula: string
  elements: Element[]
}

export default function ProductsClient({
  initialProductTypes,
}: {
  initialProductTypes: ProductType[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null)
  const [name, setName] = useState('')

  const handleOpenDialog = (product?: ProductType) => {
    if (product) {
      setEditingProduct(product)
      setName(product.name)
    } else {
      setEditingProduct(null)
      setName('')
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await updateProductType(
          Number(editingProduct.id), // ← forcé en number
          name,
          editingProduct.flatWidthFormula || 'l',
          editingProduct.flatHeightFormula || 'L'
        )
      } else {
        await createProductType(name)
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save product type', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer ce type de PLV ? Cela supprimera également tous ses éléments.'
      )
    ) {
      await deleteProductType(Number(id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Types de PLV</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau Type
        </Button>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Éléments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProductTypes.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.elements.length} éléments</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/dashboard/products/${product.id}`}>
                    <Button variant="outline" size="sm">
                      <List className="mr-2 h-4 w-4" /> Gérer les éléments
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialProductTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                  Aucun type de PLV enregistré.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Modifier le type' : 'Nouveau type de PLV'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Totem 2 faces"
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
