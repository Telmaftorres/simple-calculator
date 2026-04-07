import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, PlusCircle } from 'lucide-react'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionAccessoires() {
  const {
    hasAccessoires, setHasAccessoires,
    currentAccessoryId, setCurrentAccessoryId,
    accessories,
    currentAccessoryQty, setCurrentAccessoryQty,
    handleAddAccessory,
    selectedAccessories, handleRemoveAccessory,
    costResult,
    handleCreateAccessory,
  } = useCalculatorContext()

  const { accessoriesCost } = costResult

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
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Accessoire</Label>
            <Select
              value={currentAccessoryId || undefined}
              onValueChange={setCurrentAccessoryId}
              disabled={accessories.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={accessories.length === 0 ? "Aucun accessoire disponible" : "Choisir..."} />
              </SelectTrigger>
              <SelectContent>
                {accessories.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.name} ({acc.price.toFixed(2)}€)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24 space-y-2">
            <Label>Qté</Label>
            <Input
              type="number"
              value={currentAccessoryQty || ''}
              onChange={(e) => setCurrentAccessoryQty(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <Button
            onClick={handleAddAccessory}
            disabled={!currentAccessoryId || currentAccessoryQty <= 0}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Bouton créer un accessoire */}
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
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Vis M4"
                  className="h-8 text-sm"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs">Prix (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
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

        {selectedAccessories.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
            {selectedAccessories.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">{item.quantity} x {item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{(item.price * item.quantity).toFixed(2)} €</span>
                  <button onClick={() => handleRemoveAccessory(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200 flex justify-end text-sm font-bold text-teal-700">
              Total Accessoires: {accessoriesCost.toFixed(2)} €
            </div>
          </div>
        )}
      </div>
    </SectionDisplay>
  )
}
