'use client'

import { createContext, useContext } from 'react'
import type { useCalculator } from '@/hooks/useCalculator'
import { formatTimeSeconds, formatMinutes } from '@/lib/format'
import type { Plate, Accessory, Consumable } from '@/types/calculator'

// ✅ Type inféré automatiquement depuis useCalculator
// Plus jamais besoin de mettre à jour cette interface manuellement
type UseCalculatorReturn = ReturnType<typeof useCalculator>

export type CalculatorContextValue = UseCalculatorReturn & {
  plates: Plate[]
  accessories: Accessory[]
  consumables: Consumable[]
}

export const CalculatorContext = createContext<CalculatorContextValue | null>(null)

export function useCalculatorContext(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext)
  if (!ctx) throw new Error('useCalculatorContext doit être utilisé dans un CalculatorProvider')
  return ctx
}