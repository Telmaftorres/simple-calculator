'use client'

import { useState, useEffect } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { createQuote } from '@/app/actions/get-data'
import { createProductType } from '@/app/actions/admin'
import { toast } from 'sonner'
import { POSE_SPACING_MM } from '@/lib/constants'
import { calculateCosts } from '@/lib/calculation/costs'
import { useCalculatorForm } from './useCalculatorForm'
import { useAccessories } from './useAccessories'
import { useConsumables } from './useConsumables'
import { formatCuttingDetails, formatAssemblyDetails, formatPackDetails } from '@/lib/format'
import type { ProductType, Plate, Accessory, Consumable, ImpositionResult, ScreenState, Quote } from '@/types/calculator'

export function useCalculator(
  initialProductTypes: ProductType[],
  plates: Plate[],
  accessories: Accessory[],
  consumables: Consumable[],
  initialQuote?: Quote,
  isViewOnly?: boolean,
  settings?: Record<string, number>
) {
  const [screenState, setScreenState] = useState<ScreenState>(isViewOnly ? 'recap' : 'form')
  const [isServing, setIsServing] = useState(false)
  const [productTypes, setProductTypes] = useState(initialProductTypes)
  const [impositionResult, setImpositionResult] = useState<ImpositionResult | null>(null)

  const { formState, setField, loadQuote, resetForm } = useCalculatorForm()

  const {
    studyNumber,
    selectedProductTypeId,
    productSearch,
    isProductDropdownOpen,
    quantity,
    selectedPlateId,
    flatWidth,
    flatHeight,
    inkMlPerPlate,
    varnishSurfacePercent,
    flatColorSurfacePercent,
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
    hasPackaging,
    packagingPlateId,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth,
    packagingHeight,
    hasPrintSetup,
    hasCuttingSetup,
    hasImpression,
    hasFaconnage,
    hasConditionnement,
    hasAccessoires,
  } = formState

  // ── Accessoires ──
  const {
    selectedAccessories,
    setSelectedAccessories,
    handleAddAccessory,
    handleRemoveAccessory,
    resetAccessories,
  } = useAccessories(
    accessories,
    currentAccessoryId,
    currentAccessoryQty,
    (v) => setField('currentAccessoryId', v),
    (v) => setField('currentAccessoryQty', v),
  )

  // ── Consommables ──
  const {
    selectedConsumables,
    setSelectedConsumables,
    handleAddConsumable,
    handleRemoveConsumable,
    resetConsumables,
  } = useConsumables(
    consumables,
    quantity,
    currentConsumableId,
    currentConsumableSize,
    (v) => setField('currentConsumableId', v),
    (v) => setField('currentConsumableSize', v),
  )

  // ── Chargement d'un devis existant ──
  useEffect(() => {
    if (initialQuote) {
      loadQuote({
        studyNumber: initialQuote.study?.number || 'ET',
        quantity: initialQuote.quantity,
        selectedPlateId: initialQuote.plateId?.toString() || '',
        flatWidth: initialQuote.flatWidth || 0,
        flatHeight: initialQuote.flatHeight || 0,
        inkMlPerPlate: initialQuote.inkMlPerPlate ?? 20,
        varnishSurfacePercent: initialQuote.varnishSurfacePercent ?? 0,
        flatColorSurfacePercent: initialQuote.flatColorSurfacePercent ?? 0,
        printMode: (initialQuote.printMode as 'production' | 'quality') || 'production',
        isRectoVerso: initialQuote.isRectoVerso || false,
        rectoVersoType: initialQuote.rectoVersoType || null,
        hasVarnish: initialQuote.hasVarnish || false,
        hasFlatColor: initialQuote.hasFlatColor || false,
        cuttingTimePerPoseSeconds: initialQuote.cuttingTimePerPoseSeconds || 0,
        assemblyTimePerPieceSeconds: initialQuote.assemblyTimePerPieceSeconds || 0,
        packTimePerPieceSeconds: initialQuote.packTimePerPieceSeconds || 0,
        hasAssemblyNotice: initialQuote.hasAssemblyNotice || false,
        hasPackaging: initialQuote.hasPackaging || false,
        packagingPlateId: initialQuote.packagingPlateId?.toString() || '',
        packagingQuantity: initialQuote.packagingQuantity || 0,
        packagingCuttingTimePerPoseSeconds: initialQuote.packagingCuttingTimePerPoseSeconds || 20,
        packagingWidth: initialQuote.packagingWidth || 0,
        packagingHeight: initialQuote.packagingHeight || 0,
        hasPrintSetup: initialQuote.hasPrintSetup ?? true,
        hasCuttingSetup: initialQuote.hasCuttingSetup ?? true,
        hasImpression: initialQuote.hasImpression ?? true,
        hasFaconnage: initialQuote.hasFaconnage ?? true,
        hasConditionnement: initialQuote.hasConditionnement ?? true,
        hasAccessoires: initialQuote.hasAccessoires ?? false,
      })

      if (initialQuote.accessories) {
        setSelectedAccessories(initialQuote.accessories.map((qa) => ({
          id: qa.accessoryId,
          name: qa.accessory?.name || 'Inconnu',
          price: qa.accessory?.price || 0,
          quantity: qa.quantity,
        })))
      }

      if (initialQuote.consumables) {
        setSelectedConsumables(initialQuote.consumables.map((qc) => ({
          id: qc.consumableId,
          name: qc.consumable?.name || 'Inconnu',
          price: qc.consumable?.price || 0,
          size: qc.consumable?.size || 1,
          sizePerItem: qc.sizePerItem,
          quantity: initialQuote.quantity,
        })))
      }
    }
  }, [initialQuote, loadQuote, setSelectedAccessories, setSelectedConsumables])

  // ── Imposition ──
  const selectedPlate = plates.find((p) => p.id.toString() === selectedPlateId)
  const selectedProductType = productTypes.find((pt) => pt.id.toString() === selectedProductTypeId)
  const packagingPlate = plates.find((p) => p.id.toString() === packagingPlateId)
  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM

  useEffect(() => {
    if (selectedPlate && flatWidth > 0 && flatHeight > 0 && quantity > 0) {
      const imp = calculateImposition(
        { width: flatWidth, height: flatHeight },
        { width: selectedPlate.width, height: selectedPlate.height },
        poseSpacingMm
      )
      const platesNeeded = Math.ceil(quantity / imp.itemsPerPlate) || 0
      setImpositionResult({
        itemsPerPlate: imp.itemsPerPlate,
        platesNeeded,
        materialCost: platesNeeded * selectedPlate.cost,
        orientation: imp.orientation,
        layout: imp.layout,
      })
    } else {
      setImpositionResult(null)
    }
  }, [flatWidth, flatHeight, quantity, selectedPlate, poseSpacingMm])

  // ── Calcul des coûts — objet entier conservé ──
  const costResult = calculateCosts({
    quantity,
    impositionResult,
    selectedPlate,
    inkMlPerPlate,
    varnishSurfacePercent,
    flatColorSurfacePercent,
    printMode,
    isRectoVerso,
    hasVarnish,
    hasFlatColor,
    hasPrintSetup,
    hasCuttingSetup,
    hasImpression,
    hasFaconnage,
    hasConditionnement,
    hasAccessoires,
    cuttingTimePerPoseSeconds,
    assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds,
    hasAssemblyNotice,
    selectedAccessories,
    selectedConsumables,
    settings,
    hasPackaging,
    packagingPlate,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth,
    packagingHeight,
  })

  // ── Formatage détails sections ──
  const getCuttingDetails = () => formatCuttingDetails({
    cuttingMachineTimeMin: costResult.cuttingMachineTimeMin,
    cuttingSetupTimeMin: costResult.cuttingSetupTimeMin,
    hasCuttingSetup,
    cuttingTimePerPoseSeconds,
  })

  const getAssemblyDetails = () => formatAssemblyDetails({
    assemblyTimePerPieceSeconds,
    quantity,
  })

  const getPackDetails = () => formatPackDetails({
    packTimePerPieceSeconds,
    quantity,
    hasAssemblyNotice,
    assemblyNoticeCostPerPiece: costResult.assemblyNoticeCostPerPiece,
  })

  // ── Création type PLV ──
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

  // ── Sauvegarde ──
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
        plateId: parseInt(selectedPlateId),
        itemsPerPlate: impositionResult.itemsPerPlate,
        platesCount: impositionResult.platesNeeded,
        totalCost: costResult.totalCost,
        flatWidth,
        flatHeight,
        inkMlPerPlate,
        varnishSurfacePercent,
        flatColorSurfacePercent,
        printMode,
        isRectoVerso,
        rectoVersoType,
        hasVarnish,
        hasFlatColor,
        cuttingTimePerPoseSeconds,
        assemblyTimePerPieceSeconds,
        packTimePerPieceSeconds,
        hasAssemblyNotice,
        hasPackaging,
        packagingPlateId: packagingPlateId ? parseInt(packagingPlateId) : null,
        packagingQuantity: packagingQuantity || null,
        packagingCuttingTimePerPoseSeconds,
        packagingWidth: packagingWidth || null,
        packagingHeight: packagingHeight || null,
        hasPrintSetup,
        hasCuttingSetup,
        hasImpression,
        hasFaconnage,
        hasConditionnement,
        hasAccessoires,
        elements: selectedProductType?.elements.map((el) => ({
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
      const knownMessages: Record<string, string> = {
        'Non autorisé': 'Vous devez être connecté pour enregistrer un devis.',
        'Le type de PLV sélectionné n\'existe plus.': 'Le type de PLV sélectionné n\'existe plus.',
      }
      const rawMessage = (error as Error)?.message || ''
      const displayMessage = knownMessages[rawMessage] || 'Erreur lors de la sauvegarde. Veuillez réessayer.'
      toast.error(displayMessage)
    } finally {
      setIsServing(false)
    }
  }

  // ── Reset ──
  const handleReset = () => {
    setScreenState('form')
    resetForm()
    resetAccessories()
    resetConsumables()
    setImpositionResult(null)
  }

  return {
    screenState, setScreenState, isServing,
    productTypes,
    studyNumber, setStudyNumber: (v: string) => setField('studyNumber', v),
    productSearch, setProductSearch: (v: string) => setField('productSearch', v),
    isProductDropdownOpen, setIsProductDropdownOpen: (v: boolean) => setField('isProductDropdownOpen', v),
    selectedProductTypeId, setSelectedProductTypeId: (v: string) => setField('selectedProductTypeId', v),
    quantity, setQuantity: (v: number) => setField('quantity', v),
    selectedPlateId, setSelectedPlateId: (v: string) => setField('selectedPlateId', v),
    flatWidth, setFlatWidth: (v: number) => setField('flatWidth', v),
    flatHeight, setFlatHeight: (v: number) => setField('flatHeight', v),
    selectedPlate, selectedProductType,
    impositionResult,
    inkMlPerPlate, setInkMlPerPlate: (v: number) => setField('inkMlPerPlate', v),
    varnishSurfacePercent, setVarnishSurfacePercent: (v: number) => setField('varnishSurfacePercent', v),
    flatColorSurfacePercent, setFlatColorSurfacePercent: (v: number) => setField('flatColorSurfacePercent', v),
    printMode, setPrintMode: (v: 'production' | 'quality') => setField('printMode', v),
    isRectoVerso, setIsRectoVerso: (v: boolean) => setField('isRectoVerso', v),
    hasVarnish, setHasVarnish: (v: boolean) => setField('hasVarnish', v),
    hasFlatColor, setHasFlatColor: (v: boolean) => setField('hasFlatColor', v),
    rectoVersoType, setRectoVersoType: (v: string | null) => setField('rectoVersoType', v),
    hasPrintSetup, setHasPrintSetup: (v: boolean) => setField('hasPrintSetup', v),
    hasImpression, setHasImpression: (v: boolean) => setField('hasImpression', v),
    cuttingTimePerPoseSeconds, setCuttingTimePerPoseSeconds: (v: number) => setField('cuttingTimePerPoseSeconds', v),
    hasCuttingSetup, setHasCuttingSetup: (v: boolean) => setField('hasCuttingSetup', v),
    assemblyTimePerPieceSeconds, setAssemblyTimePerPieceSeconds: (v: number) => setField('assemblyTimePerPieceSeconds', v),
    hasFaconnage, setHasFaconnage: (v: boolean) => setField('hasFaconnage', v),
    packTimePerPieceSeconds, setPackTimePerPieceSeconds: (v: number) => setField('packTimePerPieceSeconds', v),
    hasAssemblyNotice, setHasAssemblyNotice: (v: boolean) => setField('hasAssemblyNotice', v),
    hasConditionnement, setHasConditionnement: (v: boolean) => setField('hasConditionnement', v),
    selectedAccessories,
    currentAccessoryId, setCurrentAccessoryId: (v: string) => setField('currentAccessoryId', v),
    currentAccessoryQty, setCurrentAccessoryQty: (v: number) => setField('currentAccessoryQty', v),
    hasAccessoires, setHasAccessoires: (v: boolean) => setField('hasAccessoires', v),
    selectedConsumables,
    currentConsumableId, setCurrentConsumableId: (v: string) => setField('currentConsumableId', v),
    currentConsumableSize, setCurrentConsumableSize: (v: number) => setField('currentConsumableSize', v),
    hasPackaging, setHasPackaging: (v: boolean) => setField('hasPackaging', v),
    packagingPlateId, setPackagingPlateId: (v: string) => setField('packagingPlateId', v),
    packagingQuantity, setPackagingQuantity: (v: number) => setField('packagingQuantity', v),
    packagingCuttingTimePerPoseSeconds, setPackagingCuttingTimePerPoseSeconds: (v: number) => setField('packagingCuttingTimePerPoseSeconds', v),
    packagingWidth, setPackagingWidth: (v: number) => setField('packagingWidth', v),
    packagingHeight, setPackagingHeight: (v: number) => setField('packagingHeight', v),
    handleAddAccessory, handleRemoveAccessory,
    handleAddConsumable, handleRemoveConsumable,
    handleCreateProductType, handleSave, handleReset,
    getCuttingDetails, getAssemblyDetails, getPackDetails,
    formState,
    costResult, // ← un seul objet au lieu de 15 valeurs individuelles
  }
}