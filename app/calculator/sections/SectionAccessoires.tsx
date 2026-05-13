'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, PlusCircle, ExternalLink } from 'lucide-react'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionAccessoires() {
  const {
    hasAccessoires, setHasAccessoires,
    currentAccessoryId, setCurrentAccessoryId,
    accessories: serverAccessories,
    currentAccessoryQty, setCurrentAccessoryQty,
    handleAddAccessory,
    selectedAccessories, handleRemoveAccessory,
    costResult,
    handleCreateAccessory,
    accessoriesMargePercent, setAccessoriesMargePercent,
  } = useCalculatorContext()

  const { accessoriesCost } = costResult

  // Liste locale — fusionne les accessoires serveur + les nouveaux créés en session
  const [localAccessories, setLocalAccessories] = useState<typeof serverAccessories>([])
  const allAccessories = [
    ...serverAccessories,
    ...localAccessories.filter(la => !serverAccessories.find(sa => sa.id === la.id)),
  ]

  // Recherche combobox
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const filtered = allAccessories.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedAcc = currentAccessoryId
    ? allAccessories.find(a => a.id.toString() === currentAccessoryId)
    : null

  const handleSelect = (acc: typeof allAccessories[0]) => {
    setCurrentAccessoryId(acc.id.toString())
    setSearch(acc.name)
    setDropdownOpen(false)
  }

  // Formulaire création
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    const price = parseFloat(newPrice)
    if (!newName.trim() || isNaN(price) || price <= 0) return
    setIsCreating(true)
    const result = await handleCreateAccessory(newName.trim(), price)
    setIsCreating(false)
    if (result) {
      // Ajouter à la liste locale et directement aux sélectionnés
      setLocalAccessories(prev => [...prev, result])
      setCurrentAccessoryId(result.id.toString())
      setSearch(result.name)
      setNewName('')
      setNewPrice('')
      setShowCreateForm(false)
    }
  }

  return (
    <SectionDisplay
      number="8"
      title="Accessoires"
      color="teal"
      enabled={hasAccessoires}
      onToggle={setHasAccessoires}
    >
      <div className="space-y-4">

        {/* Ligne recherche + qté + bouton ajouter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Accessoire</Label>
            <a
              href="/dashboard/accessories"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
            >
              <ExternalLink className="h-3 w-3" />
              Voir la base
            </a>
          </div>

          {/* Combobox recherche */}
          <div className="relative" ref={searchRef}>
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setDropdownOpen(true); setCurrentAccessoryId('') }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={allAccessories.length === 0 ? 'Aucun accessoire disponible' : 'Rechercher un accessoire…'}
              disabled={allAccessories.length === 0}
            />
            {dropdownOpen && (
              <div className="absolute z-20 w-full bg-white border border-slate-200 shadow-lg mt-1 rounded-lg max-h-48 overflow-auto">
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-400">Aucun résultat</div>
                )}
                {filtered.map(acc => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                    onMouseDown={e => { e.preventDefault(); handleSelect(acc) }}
                  >
                    <span className="font-medium text-slate-800">{acc.name}</span>
                    <span className="text-slate-400 text-xs">{acc.price.toFixed(2)} €/pce</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Qté + bouton ajouter sur une ligne séparée, le bouton ne peut pas disparaître */}
          <div className="flex gap-2">
            <div className="w-28 shrink-0">
              <Input
                type="number"
                value={currentAccessoryQty || ''}
                onChange={e => setCurrentAccessoryQty(parseInt(e.target.value) || 0)}
                placeholder="Qté"
              />
            </div>
            <Button
              onClick={() => { handleAddAccessory(); setSearch(''); setCurrentAccessoryId('') }}
              disabled={!currentAccessoryId || !selectedAcc || currentAccessoryQty <= 0}
              className="flex-1 bg-teal-600 hover:bg-teal-700 gap-1"
            >
              <Plus className="h-4 w-4" />
              {selectedAcc ? `Ajouter "${selectedAcc.name.length > 20 ? selectedAcc.name.slice(0, 20) + '…' : selectedAcc.name}"` : 'Ajouter'}
            </Button>
          </div>
        </div>

        {/* Marge */}
        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm text-slate-500">Marge accessoires</Label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={accessoriesMargePercent || ''}
              onChange={e => setAccessoriesMargePercent(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-20 text-sm"
            />
            <span className="text-sm text-slate-400">%</span>
          </div>
          {accessoriesMargePercent > 0 && (
            <span className="text-xs text-teal-600 font-medium">
              +{((accessoriesCost / (1 + accessoriesMargePercent / 100)) * accessoriesMargePercent / 100).toFixed(2)} &euro;
            </span>
          )}
        </div>

        {/* Créer un accessoire */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            Créer un nouvel accessoire
          </button>
        ) : (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-3">
            <div className="text-sm font-medium text-teal-800">Nouvel accessoire</div>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Nom</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Vis M4"
                  className="h-8 text-sm"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs">Prix unitaire (&euro;)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowCreateForm(false); setNewName(''); setNewPrice('') }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleCreate}
                disabled={isCreating || !newName.trim() || !newPrice || parseFloat(newPrice) <= 0}
              >
                {isCreating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        )}

        {/* Liste des accessoires sélectionnés */}
        {selectedAccessories.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
            {selectedAccessories.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">{item.quantity} &times; {item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{(item.price * item.quantity).toFixed(2)} &euro;</span>
                  <button onClick={() => handleRemoveAccessory(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200 flex justify-end text-sm font-bold text-teal-700">
              Total : {accessoriesCost.toFixed(2)} &euro;
              {accessoriesMargePercent > 0 && (
                <span className="ml-1 font-normal text-slate-400">(marge {accessoriesMargePercent}% incluse)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionDisplay>
  )
}
