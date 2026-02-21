'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { createConsumable, updateConsumable, deleteConsumable } from '@/app/actions/consumables'

type Consumable = {
  id: number
  name: string
  price: number
  size: number
}

export default function ConsumablesClient({
  initialConsumables,
}: {
  initialConsumables: Consumable[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null)
  
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')

  const handleOpenDialog = (consumable?: Consumable) => {
    if (consumable) {
      setEditingConsumable(consumable)
      setName(consumable.name)
      setPrice(consumable.price.toString())
      setSize(consumable.size.toString())
    } else {
      setEditingConsumable(null)
      setName('')
      setPrice('')
      setSize('')
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name,
        price: parseFloat(price.replace(',', '.')),
        size: parseFloat(size.replace(',', '.')),
      }

      if (editingConsumable) {
        await updateConsumable(editingConsumable.id, payload)
      } else {
        await createConsumable(payload)
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save consumable', error)
      alert("Erreur lors de l'enregistrement du consommable. Vérifiez les champs.")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce consommable ?')) {
      try {
        await deleteConsumable(id)
      } catch (error) {
        console.error('Failed to delete consumable', error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consommables</h2>
          <p className="text-muted-foreground">Gérez les éléments de façonnage (ex: adhésifs).</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prix au rouleau/unité</TableHead>
              <TableHead>Taille totale (mètres/unités)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialConsumables.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.price.toFixed(2)} €</TableCell>
                <TableCell>{item.size} m</TableCell>
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
            {initialConsumables.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  Aucun consommable enregistré pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConsumable ? 'Modifier le consommable' : 'Nouveau consommable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Scotch double face"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Prix</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15.00"
                    required
                  />
                  <div className="absolute right-3 top-2 text-slate-400">€</div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="size">Taille totale (m)</Label>
                <div className="relative">
                  <Input
                    id="size"
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="33"
                    required
                  />
                  <div className="absolute right-3 top-2 text-slate-400">m</div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
