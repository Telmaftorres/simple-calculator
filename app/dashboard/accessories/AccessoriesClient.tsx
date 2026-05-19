'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Package, Link as LinkIcon, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { createAccessory, updateAccessory, deleteAccessory } from '@/app/actions/accessories'
import { extractAccessoryFromUrl } from '@/app/actions/extract-url'

type Accessory = {
  id: number
  name: string
  description: string | null
  price: number
  supplier: string | null
  supplierRef: string | null
  supplierUrl: string | null
  lotSize: number | null
  imageUrl: string | null
  weight: number | null
}

export default function AccessoriesClient({ initialAccessories }: { initialAccessories: Accessory[] }) {
  const [accessories, setAccessories] = useState(initialAccessories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Accessory | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // URL auto-fill
  const [urlInput, setUrlInput] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', supplier: '',
    supplierRef: '', supplierUrl: '', lotSize: '', imageUrl: '', weight: '',
  })

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', supplier: '', supplierRef: '', supplierUrl: '', lotSize: '', imageUrl: '', weight: '' })
    setEditingItem(null)
    setUrlInput('')
    setExtractError(null)
  }

  const handleOpenDialog = (item?: Accessory) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        supplier: item.supplier || '',
        supplierRef: item.supplierRef || '',
        supplierUrl: item.supplierUrl || '',
        lotSize: item.lotSize?.toString() || '',
        imageUrl: item.imageUrl || '',
        weight: item.weight ? item.weight.toString() : '',
      })
      setUrlInput(item.supplierUrl || '')
    } else {
      resetForm()
    }
    setExtractError(null)
    setIsDialogOpen(true)
  }

  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return
    setIsExtracting(true)
    setExtractError(null)
    try {
      const result = await extractAccessoryFromUrl(urlInput.trim())
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        supplier: result.supplier || prev.supplier,
        supplierRef: result.supplierRef || prev.supplierRef,
        supplierUrl: result.supplierUrl,
        lotSize: result.lotSize?.toString() || prev.lotSize,
        imageUrl: result.imageUrl || prev.imageUrl,
        price: result.unitPriceHT != null ? result.unitPriceHT.toFixed(4) : prev.price,
      }))
      toast.success('Informations extraites')
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : 'Erreur lors de la récupération')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      supplier: formData.supplier || undefined,
      supplierRef: formData.supplierRef || undefined,
      supplierUrl: formData.supplierUrl || undefined,
      lotSize: formData.lotSize ? parseInt(formData.lotSize) : undefined,
      imageUrl: formData.imageUrl || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
    }
    try {
      if (editingItem) {
        await updateAccessory(editingItem.id, payload)
        setAccessories(prev => prev.map(a => a.id === editingItem.id ? {
          ...a,
          name: payload.name,
          description: payload.description ?? null,
          price: payload.price,
          supplier: payload.supplier ?? null,
          supplierRef: payload.supplierRef ?? null,
          supplierUrl: payload.supplierUrl ?? null,
          lotSize: payload.lotSize ?? null,
          imageUrl: payload.imageUrl ?? null,
          weight: payload.weight ?? null,
        } : a))
        toast.success('Accessoire modifié')
      } else {
        const created = await createAccessory(payload)
        const newItem: Accessory = {
          id: created.id,
          name: created.name,
          description: created.description ?? null,
          price: created.price,
          supplier: created.supplier ?? null,
          supplierRef: (created as unknown as Accessory).supplierRef ?? null,
          supplierUrl: (created as unknown as Accessory).supplierUrl ?? null,
          lotSize: (created as unknown as Accessory).lotSize ?? null,
          imageUrl: (created as unknown as Accessory).imageUrl ?? null,
          weight: created.weight ?? null,
        }
        setAccessories(prev => [...prev, newItem])
        toast.success('Accessoire créé')
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet accessoire ?')) return
    setDeletingId(id)
    try {
      await deleteAccessory(id)
      setAccessories(prev => prev.filter(a => a.id !== id))
      toast.success('Accessoire supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
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
          <p className="text-slate-500">Gérez les accessoires disponibles pour les devis.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un accessoire
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Accessoire</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Réf</TableHead>
              <TableHead className="text-right">Lot</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accessories.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-500">{item.supplier || '—'}</TableCell>
                <TableCell>
                  {item.supplierUrl ? (
                    <a href={item.supplierUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-mono">
                      {item.supplierRef || 'Lien'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">{item.supplierRef || '—'}</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-slate-500">
                  {item.lotSize ? `${item.lotSize} pcs` : '—'}
                </TableCell>
                <TableCell className="text-right font-medium">{item.price.toFixed(4)} €</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}>
                    <Trash2 className={`h-4 w-4 text-red-500 ${deletingId === item.id ? 'animate-pulse' : ''}`} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {accessories.length === 0 && (
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

      <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier l'accessoire" : 'Ajouter un accessoire'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* URL auto-fill */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">URL fournisseur</Label>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleExtractUrl())}
                  placeholder="https://www.fournisseur.com/produit…"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleExtractUrl}
                  disabled={isExtracting || !urlInput.trim()} className="shrink-0 gap-1.5">
                  {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                  {isExtracting ? 'Extraction…' : 'Extraire'}
                </Button>
              </div>
              {extractError && <p className="text-xs text-red-500">{extractError}</p>}
            </div>


            <div className="grid gap-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Broche plastique 6mm" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input id="supplier" value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ex: Caractères" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplierRef">Référence</Label>
                <Input id="supplierRef" value={formData.supplierRef}
                  onChange={e => setFormData({ ...formData, supplierRef: e.target.value })}
                  placeholder="Ex: XRP4830" className="font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="price">Prix unitaire HT (€) *</Label>
                <Input type="number" step="0.0001" id="price" value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.0000" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lotSize">Taille du lot</Label>
                <Input type="number" id="lotSize" value={formData.lotSize}
                  onChange={e => setFormData({ ...formData, lotSize: e.target.value })}
                  placeholder="Ex: 100" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Longueur 200mm, blanc" />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
