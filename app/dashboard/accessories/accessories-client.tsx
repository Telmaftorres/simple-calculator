'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
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
import { createAccessory, updateAccessory, deleteAccessory } from '@/app/actions/accessories'

type Accessory = {
  id: number
  name: string
  description: string | null
  price: number
  supplier: string | null
  weight: number | null
}

export default function AccessoriesClient({
  initialAccessories,
}: {
  initialAccessories: Accessory[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Accessory | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    supplier: '',
    weight: '',
  })

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', supplier: '', weight: '' })
    setEditingItem(null)
  }

  const handleOpenDialog = (item?: Accessory) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        supplier: item.supplier || '',
        weight: item.weight ? item.weight.toString() : '',
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
      description: formData.description,
      price: parseFloat(formData.price),
      supplier: formData.supplier,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
    }

    try {
      if (editingItem) {
        await updateAccessory(editingItem.id, payload)
      } else {
        await createAccessory(payload)
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save accessory', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet accessoire ?')) {
      await deleteAccessory(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600" />
            Accessoires
          </h2>
          <p className="text-slate-500">
            Gérez les accessoires (grips, crochets...) disponibles pour les devis.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un accessoire
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Poids</TableHead>
              <TableHead className="text-right">Prix (€)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialAccessories.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-slate-500">{item.description}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell className="text-right">
                  {item.weight ? `${item.weight} g` : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">{item.price.toFixed(2)} €</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialAccessories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-slate-300" />
                    <p>Aucun accessoire enregistré.</p>
                  </div>
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
              {editingItem ? "Modifier l'accessoire" : 'Ajouter un accessoire'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Grip Magnétique"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ex: 75mm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="ex: Caractères"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">Poids (g)</Label>
                <Input
                  type="number"
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="ex: 76"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Prix (€)</Label>
              <Input
                type="number"
                step="0.01"
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
