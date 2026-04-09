'use client'

import { useState } from 'react'
import type { Accessory, SelectedAccessory } from '@/types/calculator'

export function useAccessories(
  accessories: Accessory[],
  currentAccessoryId: string,
  currentAccessoryQty: number,
  setCurrentAccessoryId: (v: string) => void,
  setCurrentAccessoryQty: (v: number) => void,
  initialAccessories: SelectedAccessory[] = []
) {
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>(initialAccessories)

  const handleAddAccessory = () => {
    if (!currentAccessoryId || currentAccessoryQty <= 0) return
    const acc = accessories.find((a) => a.id.toString() === currentAccessoryId)
    if (!acc) {
      console.warn(`useAccessories: accessoire introuvable pour l'ID "${currentAccessoryId}"`)
      return
    }
    const existing = selectedAccessories.find((sa) => sa.id === acc.id)
    if (existing) {
      setSelectedAccessories(
        selectedAccessories.map((sa) =>
          sa.id === acc.id ? { ...sa, quantity: sa.quantity + currentAccessoryQty } : sa
        )
      )
    } else {
      setSelectedAccessories([
        ...selectedAccessories,
        { id: acc.id, name: acc.name, price: acc.price, quantity: currentAccessoryQty },
      ])
    }
    setCurrentAccessoryQty(0)
  }

  const handleRemoveAccessory = (id: number) => {
    setSelectedAccessories(selectedAccessories.filter((sa) => sa.id !== id))
  }

  const resetAccessories = () => setSelectedAccessories([])

  return {
    selectedAccessories,
    setSelectedAccessories,
    handleAddAccessory,
    handleRemoveAccessory,
    resetAccessories,
  }
}