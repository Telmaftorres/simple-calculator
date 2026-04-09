'use client'

import { useState } from 'react'
import type { Consumable, SelectedConsumable } from '@/types/calculator'

export function useConsumables(
  consumables: Consumable[],
  quantity: number,
  currentConsumableId: string,
  currentConsumableSize: number,
  setCurrentConsumableId: (v: string) => void,
  setCurrentConsumableSize: (v: number) => void,
  initialConsumables: SelectedConsumable[] = []
) {
  const [selectedConsumables, setSelectedConsumables] = useState<SelectedConsumable[]>(initialConsumables)

  const handleAddConsumable = () => {
    if (!currentConsumableId || currentConsumableSize <= 0) return
    const c = consumables.find((x) => x.id.toString() === currentConsumableId)
    if (!c) {
      console.warn(`useConsumables: consommable introuvable pour l'ID "${currentConsumableId}"`)
      return
    }
    const existing = selectedConsumables.find((sc) => sc.id === c.id)
    if (existing) {
      setSelectedConsumables(
        selectedConsumables.map((sc) =>
          sc.id === c.id ? { ...sc, sizePerItem: sc.sizePerItem + currentConsumableSize } : sc
        )
      )
    } else {
      setSelectedConsumables([
        ...selectedConsumables,
        { id: c.id, name: c.name, price: c.price, size: c.size, sizePerItem: currentConsumableSize, quantity },
      ])
    }
    setCurrentConsumableSize(0)
  }

  const handleRemoveConsumable = (id: number) => {
    setSelectedConsumables(selectedConsumables.filter((sc) => sc.id !== id))
  }

  const resetConsumables = () => setSelectedConsumables([])

  return {
    selectedConsumables,
    setSelectedConsumables,
    handleAddConsumable,
    handleRemoveConsumable,
    resetConsumables,
  }
}