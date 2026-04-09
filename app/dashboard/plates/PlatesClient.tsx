'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import { createPlate, updatePlate, deletePlate } from '@/app/actions/catalog'

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
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)

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
    setIsSaving(true)

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
        toast.success('Plaque modifiée avec succès')
      } else {
        await createPlate(payload)
        toast.success('Plaque créée avec succès')
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save plate', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async (id: number) => {
    setConfirmingDeleteId(null)
    setDeletingId(id)
    try {
      await deletePlate(id)
      toast.success('Plaque supprimée')
    } catch (error) {
      console.error('Failed to delete plate', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
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
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plate)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    {confirmingDeleteId === plate.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          className="text-xs px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 font-medium"
                          onClick={() => handleDeleteConfirm(plate.id)}
                        >
                          Confirmer
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                          onClick={() => setConfirmingDeleteId(null)}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setConfirmingDeleteId(plate.id)} disabled={deletingId === plate.id}>
                        <Trash2 className={`h-4 w-4 text-red-500 ${deletingId === plate.id ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
                  </div>
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
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
