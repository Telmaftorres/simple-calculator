'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
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
import { updateProductType } from '@/app/actions/admin'

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

export default function FormulasClient({
  initialProductTypes,
}: {
  initialProductTypes: ProductType[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null)
  const [flatWidthFormula, setFlatWidthFormula] = useState('')
  const [flatHeightFormula, setFlatHeightFormula] = useState('')

  const handleOpenDialog = (product: ProductType) => {
    setEditingProduct(product)
    setFlatWidthFormula(product.flatWidthFormula)
    setFlatHeightFormula(product.flatHeightFormula)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      await updateProductType(
        Number(editingProduct.id), // ← forcé en number
        editingProduct.name,
        flatWidthFormula || 'l',
        flatHeightFormula || 'L'
      )
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save formulas', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Formules de Calcul</h2>
        <p className="text-muted-foreground">
          Définissez les règles de mise à plat pour chaque type de PLV.
        </p>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type de PLV</TableHead>
              <TableHead>Largeur à plat (mm)</TableHead>
              <TableHead>Longueur à plat (mm)</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProductTypes.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-sm bg-slate-50 p-2 rounded border border-transparent">
                  {product.flatWidthFormula}
                </TableCell>
                <TableCell className="font-mono text-sm bg-slate-50 p-2 rounded border border-transparent">
                  {product.flatHeightFormula}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(product)}>
                    <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialProductTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  Aucun type de PLV enregistré.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Éditer les formules : {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 space-y-1">
                <p className="font-semibold">Variables disponibles :</p>
                <ul className="list-disc list-inside ml-2">
                  <li><b>L</b> : Longueur (input utilisateur)</li>
                  <li><b>l</b> : Largeur (input utilisateur)</li>
                  <li><b>H</b> : Hauteur (input utilisateur)</li>
                </ul>
                <p className="pt-2 text-xs">
                  Utilisez des opérateurs mathématiques standards (+, -, *, /).
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="flatWidth">Formule Largeur à plat (mm)</Label>
                <Input
                  id="flatWidth"
                  value={flatWidthFormula}
                  onChange={(e) => setFlatWidthFormula(e.target.value)}
                  placeholder="ex: 100 + l + L + l"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="flatHeight">Formule Longueur à plat (mm)</Label>
                <Input
                  id="flatHeight"
                  value={flatHeightFormula}
                  onChange={(e) => setFlatHeightFormula(e.target.value)}
                  placeholder="ex: 100 + H + l + 100"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer les formules</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
