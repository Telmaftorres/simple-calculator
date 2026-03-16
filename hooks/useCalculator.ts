'use client'

import { useState, useEffect } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { createQuote } from '@/app/actions/get-data'
import { createProductType } from '@/app/actions/admin'
import { toast } from 'sonner'
import { CUTTING_SETUP_SECONDS, ASSEMBLY_NOTICE_COST_PER_PIECE } from '@/lib/constants'
import { useCostCalculation } from './useCostCalculation'
import { useCalculatorForm } from './useCalculatorForm'
import type {
  ProductType,
  Plate,
  Accessory,
  Consumable,
  SelectedAccessory,
  SelectedConsumable,
  ImpositionResult,
  ScreenState,
  Quote,
  PLVElement,
} from '@/types/calculator'

export function useCalculator(
  initialProductTypes: ProductType[],
  plates: Plate[],
  accessories: Accessory[],
  consumables: Consumable[],
  initialQuote?: Quote,
  isViewOnly?: boolean,
  settings?: Record<string, number>
) {
  // ── UI State ──
  const [screenState, setScreenState] = useState<ScreenState>(isViewOnly ? 'recap' : 'form')
  const [isServing, setIsServing] = useState(false)
  const [productTypes, setProductTypes] = useState(initialProductTypes)
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([])
  const [selectedConsumables, setSelectedConsumables] = useState<SelectedConsumable[]>([])
  const [impositionResult, setImpositionResult] = useState<ImpositionResult | null>(null)

  // ── Form State (useReducer) ──
  const { formState, setField, resetForm } = useCalculatorForm()

  const {
    studyNumber,
    selectedProductTypeId,
    productSearch,
    isProductDropdownOpen,
    quantity,
    selectedPlateId,
    flatWidth,
    flatHeight,
    printSurfacePercent,
    printMode,
    isRectoVerso,
    hasVarnish,
    hasFlatColor,
    rectoVersoType,
    cuttingTimePerPoseSeconds,
    assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds,
    hasAssemblyNotice,
    currentAccessoryId,
    currentAccessoryQty,
    currentConsumableId,
    currentConsumableSize,
  } = formState

  // ── Initialization from initialQuote ──
  useEffect(() => {
    if (initialQuote) {
      setField('studyNumber', initialQuote.study?.number || 'ET')
      setField('selectedProductTypeId', initialQuote.productTypeId.toString())
      setField('quantity', initialQuote.quantity)
      setField('selectedPlateId', initialQuote.plateId?.toString() || '')
      setField('flatWidth', initialQuote.width)
      setField('flatHeight', initialQuote.height)
      setField('printSurfacePercent', initialQuote.printSurface || 0)
      setField('printMode', (initialQuote.printMode as 'production' | 'quality') || 'production')
      setField('isRectoVerso', initialQuote.isRectoVerso || false)
      setField('rectoVersoType', initialQuote.rectoVersoType || null)
      setField('hasVarnish', initialQuote.hasVarnish || false)
      setField('hasFlatColor', initialQuote.hasFlatColor || false)
      setField('cuttingTimePerPoseSeconds', initialQuote.cuttingTimePerPoseSeconds || 20)
      setField('assemblyTimePerPieceSeconds', initialQuote.assemblyTimePerPieceSeconds || 0)
      setField('packTimePerPieceSeconds', initialQuote.packTimePerPieceSeconds || 0)
      setField('hasAssemblyNotice', initialQuote.hasAssemblyNotice || false)

      if (initialQuote.accessories) {
        const loadedAccs: SelectedAccessory[] = initialQuote.accessories.map((qa) => {
          const acc = accessories.find((a) => a.id === qa.accessoryId)
          return {
            id: qa.accessoryId,
            name: acc?.name || 'Inconnu',
            price: acc?.price || 0,
            quantity: qa.quantity,
          }
        })
        setSelectedAccessories(loadedAccs)
      }

      if (initialQuote.consumables) {
        const loadedCons: SelectedConsumable[] = initialQuote.consumables.map((qc) => {
          const c = consumables.find((x) => x.id === qc.consumableId)
          return {
            id: qc.consumableId,
            name: c?.name || 'Inconnu',
            price: c?.price || 0,
            size: c?.size || 1,
            sizePerItem: qc.sizePerItem,
            quantity: initialQuote.quantity,
          }
        })
        setSelectedConsumables(loadedCons)
      }
    }
  }, [initialQuote, accessories, consumables])

  // ── Derived values ──
  const selectedPlate = plates.find((p) => p.id.toString() === selectedPlateId)
  const selectedProductType = productTypes.find((pt) => pt.id.toString() === selectedProductTypeId)

  // ── Imposition calculation ──
  useEffect(() => {
    if (selectedPlate && flatWidth > 0 && flatHeight > 0 && quantity > 0) {
      const imp = calculateImposition(
        { width: flatWidth, height: flatHeight },
        { width: selectedPlate.width, height: selectedPlate.height },
        10
      )
      const platesNeeded = Math.ceil(quantity / imp.itemsPerPlate) || 0
      const materialCost = platesNeeded * selectedPlate.cost

      setImpositionResult({
        itemsPerPlate: imp.itemsPerPlate,
        platesNeeded,
        materialCost,
        orientation: imp.orientation,
        layout: imp.layout,
      })
    } else {
      setImpositionResult(null)
    }
  }, [flatWidth, flatHeight, quantity, selectedPlate])

  // ── Cost calculations ──
  const {
    printingCostData,
    printingCost,
    cuttingCost,
    assemblyCost,
    packagingCost,
    accessoriesCost,
    consumablesCost,
    totalCost,
  } = useCostCalculation({
    quantity,
    impositionResult,
    selectedPlate,
    printSurfacePercent,
    printMode,
    isRectoVerso,
    hasVarnish,
    hasFlatColor,
    cuttingTimePerPoseSeconds,
    assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds,
    hasAssemblyNotice,
    selectedAccessories,
    selectedConsumables,
    settings,
  })
  
  // ── Detail helpers ──
  const getCuttingDetails = () => {
    const totalSeconds = cuttingTimePerPoseSeconds * quantity + CUTTING_SETUP_SECONDS
    const totalMinutes = totalSeconds / 60
    return `${formatMinutes(totalMinutes)} (${formatTimeSeconds(cuttingTimePerPoseSeconds)}/pose + ${CUTTING_SETUP_SECONDS / 60} min calage)`
  }

  const getAssemblyDetails = () => {
    const totalMinutes = (assemblyTimePerPieceSeconds * quantity) / 60
    return `${formatMinutes(totalMinutes)} (${formatTimeSeconds(assemblyTimePerPieceSeconds)}/pce)`
  }

  const getPackDetails = () => {
    const totalMinutes = (packTimePerPieceSeconds * quantity) / 60
    let details = `${formatMinutes(totalMinutes)} (${formatTimeSeconds(packTimePerPieceSeconds)}/pce)`
    if (hasAssemblyNotice) {
      const noticeCost = ASSEMBLY_NOTICE_COST_PER_PIECE * quantity
      details += ` + Notice: ${noticeCost.toFixed(2)}€`
    }
    return details
  }

  // ── Actions ──
  const handleAddAccessory = () => {
    if (!currentAccessoryId || currentAccessoryQty <= 0) return
    const acc = accessories.find((a) => a.id.toString() === currentAccessoryId)
    if (!acc) return

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
    setField('currentAccessoryQty', 0)
  }

  const handleRemoveAccessory = (id: number) => {
    setSelectedAccessories(selectedAccessories.filter((sa) => sa.id !== id))
  }

  const handleAddConsumable = () => {
    if (!currentConsumableId || currentConsumableSize <= 0) return
    const c = consumables.find((x) => x.id.toString() === currentConsumableId)
    if (!c) return

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
        {
          id: c.id,
          name: c.name,
          price: c.price,
          size: c.size,
          sizePerItem: currentConsumableSize,
          quantity,
        },
      ])
    }
    setField('currentConsumableSize', 0)
  }

  const handleRemoveConsumable = (id: number) => {
    setSelectedConsumables(selectedConsumables.filter((sc) => sc.id !== id))
  }

  const handleCreateProductType = async () => {
    if (!productSearch) return
    try {
      const newType = await createProductType(productSearch)
      if (!productTypes.find((pt) => pt.id === newType.id)) {
        setProductTypes([
          ...productTypes,
          { ...newType, flatWidthFormula: 'l', flatHeightFormula: 'L', elements: [] },
        ])
      }
      setField('selectedProductTypeId', newType.id.toString())
      setField('productSearch', newType.name)
      setField('isProductDropdownOpen', false)
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la création du type de PLV')
    }
  }

  const handleSave = async () => {
    const parsedProductId = parseInt(selectedProductTypeId)
    if (!impositionResult || !selectedPlateId || !selectedProductTypeId || isNaN(parsedProductId)) {
      toast.error('Veuillez sélectionner un Type de PLV valide.')
      return
    }
    setIsServing(true)
    try {
      await createQuote({
        studyNumber,
        productTypeId: parsedProductId,
        quantity,
        width: flatWidth,
        height: flatHeight,
        plateId: parseInt(selectedPlateId),
        itemsPerPlate: impositionResult.itemsPerPlate,
        platesCount: impositionResult.platesNeeded,
        totalCost,
        flatWidth,
        flatHeight,
        printSurface: printSurfacePercent,
        printMode,
        isRectoVerso,
        rectoVersoType,
        hasVarnish,
        hasFlatColor,
        cuttingTimePerPoseSeconds,
        assemblyTimePerPieceSeconds,
        packTimePerPieceSeconds,
        hasAssemblyNotice,
        elements:
          selectedProductType?.elements.map((el: PLVElement) => ({
            name: el.name,
            quantity: el.quantity,
          })) || [],
        accessories: selectedAccessories.map((sa) => ({
          id: sa.id,
          quantity: sa.quantity,
        })),
        consumables: selectedConsumables.map((sc) => ({
          id: sc.id,
          sizePerItem: sc.sizePerItem,
        })),
      })
      setScreenState('success')
      setTimeout(() => setScreenState('recap'), 3000)
    } catch (error: unknown) {
      console.error('Save error:', error)
      toast.error((error as Error)?.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsServing(false)
    }
  }

  const handleReset = () => {
    setScreenState('form')
    resetForm()
    setSelectedAccessories([])
    setSelectedConsumables([])
    setImpositionResult(null)
  }

  return {
    // UI state
    screenState,
    setScreenState,
    isServing,

    // Product types
    productTypes,

    // Form state
    studyNumber,
    setStudyNumber: (v: string) => setField('studyNumber', v),
    productSearch,
    setProductSearch: (v: string) => setField('productSearch', v),
    isProductDropdownOpen,
    setIsProductDropdownOpen: (v: boolean) => setField('isProductDropdownOpen', v),
    selectedProductTypeId,
    setSelectedProductTypeId: (v: string) => setField('selectedProductTypeId', v),
    quantity,
    setQuantity: (v: number) => setField('quantity', v),
    selectedPlateId,
    setSelectedPlateId: (v: string) => setField('selectedPlateId', v),
    flatWidth,
    setFlatWidth: (v: number) => setField('flatWidth', v),
    flatHeight,
    setFlatHeight: (v: number) => setField('flatHeight', v),
    selectedPlate,
    selectedProductType,

    // Imposition
    impositionResult,

    // Impression
    printSurfacePercent,
    setPrintSurfacePercent: (v: number) => setField('printSurfacePercent', v),
    printMode,
    setPrintMode: (v: 'production' | 'quality') => setField('printMode', v),
    isRectoVerso,
    setIsRectoVerso: (v: boolean) => setField('isRectoVerso', v),
    hasVarnish,
    setHasVarnish: (v: boolean) => setField('hasVarnish', v),
    hasFlatColor,
    setHasFlatColor: (v: boolean) => setField('hasFlatColor', v),
    rectoVersoType,
    setRectoVersoType: (v: string | null) => setField('rectoVersoType', v),
    printingCostData,
    printingCost,

    // Découpe
    cuttingTimePerPoseSeconds,
    setCuttingTimePerPoseSeconds: (v: number) => setField('cuttingTimePerPoseSeconds', v),
    cuttingCost,

    // Façonnage
    assemblyTimePerPieceSeconds,
    setAssemblyTimePerPieceSeconds: (v: number) => setField('assemblyTimePerPieceSeconds', v),
    assemblyCost,

    // Conditionnement
    packTimePerPieceSeconds,
    setPackTimePerPieceSeconds: (v: number) => setField('packTimePerPieceSeconds', v),
    hasAssemblyNotice,
    setHasAssemblyNotice: (v: boolean) => setField('hasAssemblyNotice', v),
    packagingCost,

    // Accessoires
    selectedAccessories,
    currentAccessoryId,
    setCurrentAccessoryId: (v: string) => setField('currentAccessoryId', v),
    currentAccessoryQty,
    setCurrentAccessoryQty: (v: number) => setField('currentAccessoryQty', v),
    accessoriesCost,

    // Consommables
    selectedConsumables,
    currentConsumableId,
    setCurrentConsumableId: (v: string) => setField('currentConsumableId', v),
    currentConsumableSize,
    setCurrentConsumableSize: (v: number) => setField('currentConsumableSize', v),
    consumablesCost,

    // Coûts
    totalCost,

    // Actions
    handleAddAccessory,
    handleRemoveAccessory,
    handleAddConsumable,
    handleRemoveConsumable,
    handleCreateProductType,
    handleSave,
    handleReset,

    // Helpers
    getCuttingDetails,
    getAssemblyDetails,
    getPackDetails,
  }
}

// ── Formatting utilities ──

export function formatTimeSeconds(seconds: number): string {
  if (seconds === 0) return '0 sec'
  if (seconds < 60) return `${seconds} sec`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`
}

export function formatMinutes(mins: number): string {
  if (mins === 0) return '0 min'
  if (mins < 1) return `${Math.ceil(mins * 60)} sec`
  const wholeMins = Math.floor(mins)
  const seconds = Math.round((mins - wholeMins) * 60)
  return seconds > 0 ? `${wholeMins} min ${seconds} sec` : `${wholeMins} min`
}