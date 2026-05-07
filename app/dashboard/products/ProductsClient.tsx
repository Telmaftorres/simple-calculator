'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, List, LayoutGrid, Search, ImagePlus, X } from 'lucide-react'
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
import { createProductType, updateProductType, deleteProductType } from '@/app/actions/catalog'
import Link from 'next/link'
import Image from 'next/image'

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
  imageUrl: string | null
  elements: Element[]
}

export default function ProductsClient({
  initialProductTypes,
}: {
  initialProductTypes: ProductType[]
}) {
  const [productTypes, setProductTypes] = useState(initialProductTypes)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = productTypes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenDialog = (product?: ProductType) => {
    if (product) {
      setEditingProduct(product)
      setName(product.name)
      setImageUrl(product.imageUrl)
    } else {
      setEditingProduct(null)
      setName('')
      setImageUrl(null)
    }
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'product-types')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur upload')
      setImageUrl(data.url)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingProduct) {
        await updateProductType(
          editingProduct.id,
          name,
          editingProduct.flatWidthFormula || 'l',
          editingProduct.flatHeightFormula || 'L',
          imageUrl,
        )
        setProductTypes(prev => prev.map(p =>
          p.id === editingProduct.id ? { ...p, name, imageUrl } : p
        ))
        toast.success('Type de PLV modifié')
      } else {
        const created = await createProductType(name)
        if (imageUrl) {
          await updateProductType(created.id, name, 'l', 'L', imageUrl)
        }
        setProductTypes(prev => [...prev, {
          id: created.id,
          name,
          flatWidthFormula: 'l',
          flatHeightFormula: 'L',
          imageUrl,
          elements: [],
        }])
        toast.success('Type de PLV créé')
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce type de PLV ? Cela supprimera également tous ses éléments.')) return
    setDeletingId(id)
    try {
      await deleteProductType(id)
      setProductTypes(prev => prev.filter(p => p.id !== id))
      toast.success('Type de PLV supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Barre d'outils ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Types de PLV</h2>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          {/* Toggle vue */}
          <div className="flex border rounded-md overflow-hidden shrink-0">
            <button
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              title="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              title="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {/* Recherche */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau
          </Button>
        </div>
      </div>

      {/* ── Vue liste ── */}
      {view === 'list' && (
        <div className="bg-white rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Éléments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <div className="relative w-10 h-10 rounded overflow-hidden border border-slate-100">
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                        <ImagePlus className="h-4 w-4 text-slate-300" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/products/${product.id}`} className="hover:text-blue-600 transition-colors">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>{product.elements.length} éléments</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                    >
                      <Trash2 className={`h-4 w-4 text-red-500 ${deletingId === product.id ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    {search ? `Aucun résultat pour "${search}"` : 'Aucun type de PLV enregistré.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Vue grille ── */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Photo */}
              <div className="relative aspect-square bg-slate-50">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <ImagePlus className="h-8 w-8 mb-1" />
                    <span className="text-xs">Pas d'image</span>
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleOpenDialog(product)}
                    className="bg-white/90 hover:bg-white text-slate-800 rounded-full p-2 shadow"
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="bg-white/90 hover:bg-white text-red-600 rounded-full p-2 shadow"
                    title="Supprimer"
                  >
                    <Trash2 className={`h-3.5 w-3.5 ${deletingId === product.id ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
              {/* Infos */}
              <div className="p-3">
                <Link href={`/dashboard/products/${product.id}`}>
                  <p className="font-medium text-sm text-slate-900 truncate hover:text-blue-600 transition-colors cursor-pointer">{product.name}</p>
                </Link>
                <span className="text-xs text-slate-400">{product.elements.length} éléments</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              {search ? `Aucun résultat pour "${search}"` : 'Aucun type de PLV enregistré.'}
            </div>
          )}
        </div>
      )}

      {/* ── Dialog création/édition ── */}
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

            {/* Upload photo */}
            <div className="grid gap-2">
              <Label>Illustration</Label>
              {imageUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <Image src={imageUrl} alt="Illustration" fill className="object-contain" unoptimized />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow"
                  >
                    <X className="h-3.5 w-3.5 text-slate-700" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">{isUploading ? 'Envoi en cours...' : 'Cliquer pour ajouter une photo'}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving || isUploading}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
