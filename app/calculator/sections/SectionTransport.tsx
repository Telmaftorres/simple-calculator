'use client'

import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { calculateTransport, suggestTransportMode, type TransportMode } from '@/lib/transport/geodis-rates'
import { GEODIS_FUEL_SURCHARGE_PERCENT, TRANSPORT_MARGIN } from '@/lib/config/pricing'
import { Plus, Trash2 } from 'lucide-react'
import type { TransportDeliveryForm } from '@/types/calculator'

function DeliveryRow({
  delivery,
  index,
  canRemove,
  onUpdate,
  onRemove,
  fuelSurchargePct,
  transportMargin,
}: {
  delivery: TransportDeliveryForm
  index: number
  canRemove: boolean
  onUpdate: <K extends keyof Omit<TransportDeliveryForm, 'id'>>(field: K, value: TransportDeliveryForm[K]) => void
  onRemove: () => void
  fuelSurchargePct: number
  transportMargin: number
}) {
  const calc = useMemo(() => {
    if (!delivery.mode || !delivery.department || delivery.units === undefined) return null
    if (delivery.mode !== 'AFFRETEMENT' && delivery.weightKg === undefined) return null
    return calculateTransport(
      delivery.mode as TransportMode,
      delivery.department,
      delivery.weightKg || 0,
      delivery.units,
      fuelSurchargePct,
      delivery.optionsHT || 0
    )
  }, [delivery, fuelSurchargePct])

  const suggestion = (delivery.weightKg !== undefined && delivery.units !== undefined)
    ? suggestTransportMode(delivery.weightKg as number, delivery.units as number)
    : null

  return (
    <div className="border border-sky-100 rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-sky-700">Point de livraison {index + 1}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Supprimer ce point de livraison"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mode selector */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium text-sm">Mode d'expédition</Label>
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'PACK30', label: 'Pack 30' },
            { id: 'MESSAGERIE_PLUS', label: 'Messagerie Plus' },
            { id: 'AFFRETEMENT', label: 'Affrètement' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => onUpdate('mode', m.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                delivery.mode === m.id
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {suggestion && (!delivery.mode || delivery.mode !== suggestion) && (
          <div
            className="text-xs text-sky-600 cursor-pointer hover:underline"
            onClick={() => onUpdate('mode', suggestion)}
          >
            Suggestion : {suggestion === 'PACK30' ? 'Pack 30' : suggestion === 'MESSAGERIE_PLUS' ? 'Messagerie Plus' : 'Affrètement'}
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Département (ex: 76)</Label>
          <Input
            value={delivery.department || ''}
            onChange={e => onUpdate('department', e.target.value.substring(0, 2) || undefined)}
            placeholder="76"
            maxLength={2}
          />
        </div>

        {delivery.mode !== 'AFFRETEMENT' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Poids total (kg)</Label>
            <Input
              type="number"
              value={delivery.weightKg ?? ''}
              onChange={e => {
                const val = parseFloat(e.target.value)
                onUpdate('weightKg', isNaN(val) ? undefined : val)
              }}
              min={0}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">{delivery.mode === 'AFFRETEMENT' ? 'Nb palettes' : 'Nb colis'}</Label>
          <Input
            type="number"
            value={delivery.units ?? ''}
            onChange={e => {
              const val = parseInt(e.target.value)
              onUpdate('units', isNaN(val) ? 1 : val)
            }}
            min={1}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Options / frais complémentaires HT</Label>
          <div className="relative">
            <Input
              type="number"
              value={delivery.optionsHT ?? ''}
              onChange={e => {
                const val = parseFloat(e.target.value)
                onUpdate('optionsHT', isNaN(val) ? 0 : val)
              }}
              min={0}
              className="pr-8"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">€</span>
          </div>
        </div>
      </div>

      {/* Recap */}
      {calc ? (
        <div className="bg-sky-50 border border-sky-100 rounded-md p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Prix de base HT {calc.zone ? `(Zone ${calc.zone})` : ''}</span>
            <span>{calc.basePrice.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Surcharge carburant ({fuelSurchargePct}%)</span>
            <span>{calc.fuelSurcharge.toFixed(2)} €</span>
          </div>
          {calc.options > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Options</span>
              <span>{calc.options.toFixed(2)} €</span>
            </div>
          )}
          {transportMargin !== 1 && (
            <div className="flex justify-between text-slate-600">
              <span>Marge (×{transportMargin.toFixed(2)})</span>
              <span>+{(calc.total * (transportMargin - 1)).toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sky-900 pt-1 border-t border-sky-200">
            <span>Total HT</span>
            <span>{(calc.total * transportMargin).toFixed(2)} €</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-2 bg-slate-50 border border-slate-100 rounded-md text-slate-400 text-xs italic">
          Complétez les champs pour calculer
        </div>
      )}
    </div>
  )
}

export function SectionTransport() {
  const { formState, addTransportDelivery, removeTransportDelivery, updateTransportDelivery, settings } =
    useCalculatorContext()

  const { transportDeliveries } = formState
  const fuelSurchargePct = settings?.GEODIS_FUEL_SURCHARGE_PERCENT ?? GEODIS_FUEL_SURCHARGE_PERCENT
  const transportMargin = settings?.TRANSPORT_MARGIN ?? TRANSPORT_MARGIN

  const grandTotal = useMemo(() => {
    return transportDeliveries.reduce((sum, d) => {
      if (!d.mode || !d.department || d.units === undefined) return sum
      if (d.mode !== 'AFFRETEMENT' && d.weightKg === undefined) return sum
      const calc = calculateTransport(
        d.mode as TransportMode,
        d.department!,
        d.weightKg || 0,
        d.units,
        fuelSurchargePct,
        d.optionsHT || 0
      )
      return sum + (calc?.total ?? 0)
    }, 0)
  }, [transportDeliveries, fuelSurchargePct])

  return (
    <SectionDisplay number="10" title="Transport" color="sky">
      <div className="space-y-4">
        {transportDeliveries.length === 0 && (
          <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm italic">
            Aucun point de livraison — cliquez sur « Ajouter » pour commencer
          </div>
        )}

        {transportDeliveries.map((delivery, index) => (
          <DeliveryRow
            key={delivery.id}
            delivery={delivery}
            index={index}
            canRemove={transportDeliveries.length > 1}
            onUpdate={(field, value) => updateTransportDelivery(delivery.id, field, value)}
            onRemove={() => removeTransportDelivery(delivery.id)}
            fuelSurchargePct={fuelSurchargePct}
            transportMargin={transportMargin}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={addTransportDelivery}
          className="w-full border-dashed border-sky-300 text-sky-600 hover:bg-sky-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un point de livraison
        </Button>

        {transportDeliveries.length > 1 && grandTotal > 0 && (
          <div className="flex justify-between items-center bg-sky-100 rounded-lg px-4 py-3 font-bold text-sky-900">
            <span>Total transport HT ({transportDeliveries.length} livraisons)</span>
            <span>{(grandTotal * transportMargin).toFixed(2)} €</span>
          </div>
        )}
      </div>
    </SectionDisplay>
  )
}
