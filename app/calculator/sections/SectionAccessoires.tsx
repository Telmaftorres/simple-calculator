import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { Accessory, SelectedAccessory } from '@/types/calculator'
import { SectionDisplay } from '../shared'

interface SectionAccessoiresProps {
  currentAccessoryId: string
  setCurrentAccessoryId: (value: string) => void
  accessories: Accessory[]
  currentAccessoryQty: number
  setCurrentAccessoryQty: (value: number) => void
  handleAddAccessory: () => void
  selectedAccessories: SelectedAccessory[]
  handleRemoveAccessory: (id: number) => void
  accessoriesCost: number
}

export function SectionAccessoires({
  currentAccessoryId,
  setCurrentAccessoryId,
  accessories,
  currentAccessoryQty,
  setCurrentAccessoryQty,
  handleAddAccessory,
  selectedAccessories,
  handleRemoveAccessory,
  accessoriesCost,
}: SectionAccessoiresProps) {
  return (
    <SectionDisplay number="7" title="Accessoires (Optionnel)" color="teal">
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

        {selectedAccessories.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
            {selectedAccessories.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">
                  {item.quantity} x {item.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    {(item.price * item.quantity).toFixed(2)} €
                  </span>
                  <button
                    onClick={() => handleRemoveAccessory(item.id)}
                    className="text-red-400 hover:text-red-600"
                  >
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
