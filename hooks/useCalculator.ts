'use client'

import { useState, useEffect } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { createQuote } from '@/app/actions/get-data'
import { createProductType } from '@/app/actions/admin'
import type {
  ProductType,
  Plate,
  Accessory,
  SelectedAccessory,
  ImpositionResult,
  PrintingCostData,
  ScreenState,
  PrintMode,
  Quote,
} from '@/types/calculator'

export function useCalculator(
  initialProductTypes: ProductType[],
  plates: Plate[],
  accessories: Accessory[],
  initialQuote?: Quote,
  isViewOnly?: boolean
) {
  // ── UI State ──
  const [screenState, setScreenState] = useState<ScreenState>(isViewOnly ? 'recap' : 'form')
  const [isServing, setIsServing] = useState(false)

  // ── Section 1: Configuration ──
  const [studyNumber, setStudyNumber] = useState<string>('ET')
  const [productTypes, setProductTypes] = useState(initialProductTypes)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(100)
  const [selectedPlateId, setSelectedPlateId] = useState<string>('')
  const [flatWidth, setFlatWidth] = useState<number>(0)
  const [flatHeight, setFlatHeight] = useState<number>(0)

 // Section 3: Impression
const [printSurfacePercent, setPrintSurfacePercent] = useState<number>(0)
const [printMode, setPrintMode] = useState<PrintMode>('production')
const [isRectoVerso, setIsRectoVerso] = useState<boolean>(false)
const [hasVarnish, setHasVarnish] = useState<boolean>(false)
const [hasFlatColor, setHasFlatColor] = useState<boolean>(false)
const [rectoVersoType, setRectoVersoType] = useState<string | null>(null)

  // ── Section 4: Découpe ──
  const [cuttingTimePerPoseSeconds, setCuttingTimePerPoseSeconds] = useState<number>(20)

  // ── Section 5: Façonnage ──
  const [assemblyTimePerPieceSeconds, setAssemblyTimePerPieceSeconds] = useState<number>(0)

  // ── Section 6: Conditionnement ──
  const [packTimePerPieceSeconds, setPackTimePerPieceSeconds] = useState<number>(0)
  const [hasAssemblyNotice, setHasAssemblyNotice] = useState<boolean>(false)

  // ── Section 7: Accessoires ──
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([])
  const [currentAccessoryId, setCurrentAccessoryId] = useState<string>('')
  const [currentAccessoryQty, setCurrentAccessoryQty] = useState<number>(0)

  // ── Initialization from initialQuote ──
  useEffect(() => {
    if (initialQuote) {
      setStudyNumber(initialQuote.study?.number || 'ET')
      setSelectedProductTypeId(initialQuote.productTypeId.toString())
      setQuantity(initialQuote.quantity)
      setSelectedPlateId(initialQuote.plateId?.toString() || '')
      setFlatWidth(initialQuote.width)
      setFlatHeight(initialQuote.height)
      setPrintSurfacePercent(initialQuote.printSurface || 0)
      setPrintMode(initialQuote.printMode as PrintMode || 'production')
      setIsRectoVerso(initialQuote.isRectoVerso || false)
      setRectoVersoType(initialQuote.rectoVersoType || null)
      setHasVarnish(initialQuote.hasVarnish || false)
      setHasFlatColor(initialQuote.hasFlatColor || false)
      setCuttingTimePerPoseSeconds(initialQuote.cuttingTimePerPoseSeconds || 20)
      setAssemblyTimePerPieceSeconds(initialQuote.assemblyTimePerPieceSeconds || 0)
      setPackTimePerPieceSeconds(initialQuote.packTimePerPieceSeconds || 0)
      setHasAssemblyNotice(initialQuote.hasAssemblyNotice || false)
      
      // Load accessories
      if (initialQuote.accessories) {
        const loadedAccs: SelectedAccessory[] = initialQuote.accessories.map(qa => {
          const acc = accessories.find(a => a.id === qa.accessoryId)
          return {
            id: qa.accessoryId,
            name: acc?.name || 'Inconnu',
            price: acc?.price || 0,
            quantity: qa.quantity
          }
        })
        setSelectedAccessories(loadedAccs)
      }
    }
  }, [initialQuote, accessories])

  // ── Derived values ──
  const selectedPlate = plates.find((p) => p.id.toString() === selectedPlateId)
  const selectedProductType = productTypes.find((pt) => pt.id.toString() === selectedProductTypeId)

  // ── Imposition calculation ──
  const [impositionResult, setImpositionResult] = useState<ImpositionResult | null>(null)

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

  const printingCostData: PrintingCostData = (() => {
    if (!impositionResult || !selectedPlate)
      return { cost: 0, timeMin: 0, inkCost: 0, laborCost: 0 }

    const inkBaseMl = 20
    const multiplier = isRectoVerso ? 2 : 1
    const inkVolumeL =
      ((impositionResult.platesNeeded * inkBaseMl * ((printSurfacePercent / 100) * 2)) / 1000) *
      multiplier

    // +5% par option activée (cumulables)
    const finishingMultiplier = 1 + (hasVarnish ? 0.05 : 0) + (hasFlatColor ? 0.05 : 0)
    const inkCost = inkVolumeL * 40 * finishingMultiplier

    const plateAreaM2 = (selectedPlate.width * selectedPlate.height) / 1000000
    const printedAreaM2 = plateAreaM2 * (printSurfacePercent / 100)
    const pace = printMode === 'production' ? 1 : 2
    const timePerPlateMin = printedAreaM2 * pace * multiplier
    const totalTimeMin = timePerPlateMin * impositionResult.platesNeeded + 15

    const laborCost = (totalTimeMin / 60) * 65

    return { cost: inkCost + laborCost, timeMin: totalTimeMin, inkCost, laborCost }
  })()

  const printingCost = printingCostData.cost

  const cuttingCost = (() => {
    if (!impositionResult) return 0
    const totalSeconds = cuttingTimePerPoseSeconds * quantity + 900
    const totalHours = totalSeconds / 3600
    return totalHours * 65
  })()

  const assemblyCost = (() => {
    const totalHours = (assemblyTimePerPieceSeconds * quantity) / 3600
    return totalHours * 45
  })()

  const packagingCost = (() => {
    const totalHours = (packTimePerPieceSeconds * quantity) / 3600
    const timeCost = totalHours * 45
    const noticeCost = hasAssemblyNotice ? 0.1 * quantity : 0
    return timeCost + noticeCost
  })()

  const accessoriesCost = selectedAccessories.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const totalCost =
    (impositionResult?.materialCost || 0) +
    printingCost +
    cuttingCost +
    assemblyCost +
    packagingCost +
    accessoriesCost

  // ── Detail helpers ──

  const getCuttingDetails = () => {
    const totalSeconds = cuttingTimePerPoseSeconds * quantity + 900
    const totalMinutes = totalSeconds / 60
    return `${formatMinutes(totalMinutes)} (${formatTimeSeconds(cuttingTimePerPoseSeconds)}/pose + 15 min calage)`
  }

  const getAssemblyDetails = () => {
    const totalMinutes = (assemblyTimePerPieceSeconds * quantity) / 60
    return `${formatMinutes(totalMinutes)} (${formatTimeSeconds(assemblyTimePerPieceSeconds)}/pce)`
  }

  const getPackDetails = () => {
    const totalMinutes = (packTimePerPieceSeconds * quantity) / 60
    let details = `${formatMinutes(totalMinutes)} (${formatTimeSeconds(packTimePerPieceSeconds)}/pce)`
    if (hasAssemblyNotice) {
      const noticeCost = 0.1 * quantity
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
    setCurrentAccessoryQty(0)
  }

  const handleRemoveAccessory = (id: number) => {
    setSelectedAccessories(selectedAccessories.filter((sa) => sa.id !== id))
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
      setSelectedProductTypeId(newType.id.toString())
      setProductSearch(newType.name)
      setIsProductDropdownOpen(false)
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la création du type de PLV')
    }
  }

  const handleSave = async () => {
    if (!impositionResult || !selectedPlateId || !selectedProductTypeId) return
    setIsServing(true)
    try {
      await createQuote({
        studyNumber,
        productTypeId: parseInt(selectedProductTypeId),
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
          selectedProductType?.elements.map((el) => ({
            name: el.name,
            quantity: el.quantity,
          })) || [],
        accessories: selectedAccessories.map((sa) => ({
          id: sa.id,
          quantity: sa.quantity,
        })),
      })
      setScreenState('success')
      setTimeout(() => setScreenState('recap'), 3000)
    } catch (error) {
      console.error('Save error:', error)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setIsServing(false)
    }
  }

  const handleReset = () => {
    setScreenState('form')
    setStudyNumber('ET')
    setSelectedProductTypeId('')
    setProductSearch('')
    setQuantity(100)
    setSelectedPlateId('')
    setFlatWidth(0)
    setFlatHeight(0)
    setPrintSurfacePercent(0)
    setPrintMode('production')
    setIsRectoVerso(false)
    setHasVarnish(false)
    setHasFlatColor(false)
    setRectoVersoType(null)
    setCuttingTimePerPoseSeconds(20)
    setAssemblyTimePerPieceSeconds(0)
    setPackTimePerPieceSeconds(0)
    setHasAssemblyNotice(false)
    setSelectedAccessories([])
    setCurrentAccessoryId('')
    setCurrentAccessoryQty(0)
  }

  return {
    // UI state
    screenState,
    setScreenState,
    isServing,

    // Section 1
    studyNumber,
    setStudyNumber,
    productTypes,
    productSearch,
    setProductSearch,
    isProductDropdownOpen,
    setIsProductDropdownOpen,
    selectedProductTypeId,
    setSelectedProductTypeId,
    quantity,
    setQuantity,
    selectedPlateId,
    setSelectedPlateId,
    flatWidth,
    setFlatWidth,
    flatHeight,
    setFlatHeight,
    selectedPlate,
    selectedProductType,

    // Section 2
    impositionResult,

    // Section 3
    printSurfacePercent,
    setPrintSurfacePercent,
    printMode,
    setPrintMode,
    isRectoVerso,
    setIsRectoVerso,
    hasVarnish,
    setHasVarnish,
    hasFlatColor,
    setHasFlatColor,
    rectoVersoType,
    setRectoVersoType,
    printingCostData,
    printingCost,

    // Section 4
    cuttingTimePerPoseSeconds,
    setCuttingTimePerPoseSeconds,
    cuttingCost,

    // Section 5
    assemblyTimePerPieceSeconds,
    setAssemblyTimePerPieceSeconds,
    assemblyCost,

    // Section 6
    packTimePerPieceSeconds,
    setPackTimePerPieceSeconds,
    hasAssemblyNotice,
    setHasAssemblyNotice,
    packagingCost,

    // Section 7
    selectedAccessories,
    currentAccessoryId,
    setCurrentAccessoryId,
    currentAccessoryQty,
    setCurrentAccessoryQty,
    accessoriesCost,

    // Costs
    totalCost,

    // Actions
    handleAddAccessory,
    handleRemoveAccessory,
    handleCreateProductType,
    handleSave,
    handleReset,

    // Detail helpers
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
