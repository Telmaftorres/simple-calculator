'use client'

import { useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'
import { calculateTransport, suggestTransportMode, type TransportMode } from '@/lib/transport/geodis-rates'
import { GEODIS_FUEL_SURCHARGE_PERCENT } from '@/lib/constants'

export function SectionTransport() {
  const { formState, setField, settings } = useCalculatorContext()

  const {
    transportMode,
    transportDepartment,
    transportWeight,
    transportUnits,
    transportOptions,
    transportBasePrice,
    transportTotal,
  } = formState

  const fuelSurchargePct = settings?.GEODIS_FUEL_SURCHARGE_PERCENT ?? GEODIS_FUEL_SURCHARGE_PERCENT

  const calc = useMemo(() => {
    if (!transportMode || !transportDepartment || transportUnits === undefined) return null
    if (transportMode !== 'AFFRETEMENT' && transportWeight === undefined) return null
    
    return calculateTransport(
      transportMode as TransportMode,
      transportDepartment,
      transportWeight || 0,
      transportUnits,
      fuelSurchargePct,
      transportOptions || 0
    )
  }, [transportMode, transportDepartment, transportWeight, transportUnits, transportOptions, fuelSurchargePct])

  useEffect(() => {
    if (calc) {
      if (transportBasePrice !== calc.basePrice) setField('transportBasePrice', calc.basePrice)
      if (transportTotal !== calc.total) setField('transportTotal', calc.total)
    } else {
      if (transportBasePrice !== undefined) setField('transportBasePrice', undefined)
      if (transportTotal !== undefined) setField('transportTotal', undefined)
    }
  }, [calc, transportBasePrice, transportTotal, setField])

  const suggestion = (transportWeight !== undefined && transportUnits !== undefined)
    ? suggestTransportMode(transportWeight as number, transportUnits as number) : null

  return (
    <SectionDisplay
      number="10"
      title="Transport"
      color="sky"
    >
      <div className="space-y-6">
        
        {/* Mode selector */}
        <div className="space-y-3">
          <Label className="text-slate-700 font-semibold">Mode d'expédition</Label>
          <div className="flex gap-2">
            {[
              { id: 'PACK30', label: 'Pack 30' },
              { id: 'MESSAGERIE_PLUS', label: 'Messagerie Plus' },
              { id: 'AFFRETEMENT', label: 'Affrètement' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setField('transportMode', m.id)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all border ${
                  transportMode === m.id
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {suggestion && (!transportMode || transportMode !== suggestion) && (
            <div className="text-xs text-sky-600 animate-in fade-in cursor-pointer hover:underline" onClick={() => setField('transportMode', suggestion)}>
              💡 Suggestion automatique : {suggestion === 'PACK30' ? 'Pack 30' : suggestion === 'MESSAGERIE_PLUS' ? 'Messagerie Plus' : 'Affrètement'}
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Département de destination (ex: 76)</Label>
            <Input 
              value={transportDepartment || ''} 
              onChange={e => {
                const val = e.target.value.substring(0,2)
                setField('transportDepartment', val || undefined)
              }}
              placeholder="76"
              maxLength={2}
            />
          </div>
          
          {transportMode !== 'AFFRETEMENT' && (
            <div className="space-y-2 animate-in fade-in">
              <Label>Poids total (kg)</Label>
              <Input 
                type="number"
                value={transportWeight ?? ''}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  setField('transportWeight', isNaN(val) ? undefined : val)
                }}
                min={0}
              />
            </div>
          )}
          
          <div className="space-y-2 max-w-[200px]">
            <Label>{transportMode === 'AFFRETEMENT' ? 'Nombre de palettes' : 'Nombre de colis'}</Label>
            <Input
              type="number"
              value={transportUnits ?? ''}
              onChange={e => {
                  const val = parseInt(e.target.value)
                  setField('transportUnits', isNaN(val) ? 1 : val)
              }}
              min={1}
            />
          </div>

          <div className="space-y-2 max-w-[200px]">
            <Label>Options et frais complémentaires HT</Label>
            <div className="relative">
              <Input
                type="number"
                value={transportOptions ?? ''}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  setField('transportOptions', isNaN(val) ? 0 : val)
                }}
                min={0}
                className="pr-8"
              />
              <span className="absolute right-3 top-2.5 text-sm text-slate-400">€</span>
            </div>
          </div>
        </div>

        {/* Recap */}
        {calc ? (
          <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 space-y-2 animate-in fade-in">
             <div className="flex justify-between text-sm text-slate-600">
               <span>Prix de base HT {calc.zone ? `(Zone ${calc.zone})` : ''}</span>
               <span>{calc.basePrice.toFixed(2)} €</span>
             </div>
             <div className="flex justify-between text-sm text-slate-600">
               <span>Surcharge carburant ({fuelSurchargePct}%)</span>
               <span>{calc.fuelSurcharge.toFixed(2)} €</span>
             </div>
             <div className="flex justify-between text-sm text-slate-700 font-medium pt-2 border-t border-sky-200">
               <span>Sous-total HT</span>
               <span>{calc.subtotal.toFixed(2)} €</span>
             </div>
             {calc.options > 0 && (
               <div className="flex justify-between text-sm text-slate-600">
                 <span>Options</span>
                 <span>{calc.options.toFixed(2)} €</span>
               </div>
             )}
             <div className="flex justify-between text-lg text-sky-900 font-bold pt-2 border-t border-sky-200">
               <span>Total transport HT</span>
               <span>{calc.total.toFixed(2)} €</span>
             </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm italic">
            Complétez les champs pour calculer le transport
          </div>
        )}
      </div>
    </SectionDisplay>
  )
}