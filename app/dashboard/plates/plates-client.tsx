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
import { createPlate, updatePlate, deletePlate } from '@/app/actions/admin' // Adjust path if needed

type Plate = {
  id: number
  name: string
  width: number
  height: number
  cost: number
  material: string
}

export default function PlatesClient({ initialPlates }: { initialPlates: Plate[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlate, setEditingPlate] = useState<Plate | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    width: '',
    height: '',
    cost: '',
    material: '',
  })

  const resetForm = () => {
    setFormData({ name: '', width: '', height: '', cost: '', material: '' })
    setEditingPlate(null)
  }

  const handleOpenDialog = (plate?: Plate) => {
    if (plate) {
      setEditingPlate(plate)
      setFormData({
        name: plate.name,
        width: plate.width.toString(),
        height: plate.height.toString(),
        cost: plate.cost.toString(),
        material: plate.material,
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
      width: parseInt(formData.width),
      height: parseInt(formData.height),
      cost: parseFloat(formData.cost),
      material: formData.material,
    }

    try {
      if (editingPlate) {
        await updatePlate(editingPlate.id, payload)
      } else {
        await createPlate(payload)
      }
      setIsDialogOpen(false)
      // Optimistic update or refresh ? For now relying on server revalidate + reload or simple props update if parent re-renders.
      // ideally we should update local state to reflect change immediately or wait for server action return.
      // Since page is server component, router.refresh() might be needed in a real app,
      // but server actions revalidatePath SHOULD trigger a refresh of the server component data passed down.
    } catch (error) {
      console.error('Failed to save plate', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette plaque ?')) {
      await deletePlate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Matières</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une plaque
        </Button>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Dimensions (mm)</TableHead>
              <TableHead className="text-right">Coût (€)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPlates.map((plate) => (
              <TableRow key={plate.id}>
                <TableCell className="font-medium">{plate.name}</TableCell>
                <TableCell>{plate.material}</TableCell>
                <TableCell>
                  {plate.width} x {plate.height}
                </TableCell>
                <TableCell className="text-right">{plate.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plate)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plate.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialPlates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Aucune plaque enregistrée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlate ? 'Modifier la plaque' : 'Ajouter une plaque'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Microbis Standard"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="material">Matière</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="ex: Carton Microbis"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="width">Largeur (mm)</Label>
                <Input
                  type="number"
                  id="width"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="height">Hauteur (mm)</Label>
                <Input
                  type="number"
                  id="height"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Coût (€)</Label>
              <Input
                type="number"
                step="0.01"
                id="cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
