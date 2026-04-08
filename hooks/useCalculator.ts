'use client'

import { useState, useEffect, useCallback } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { createQuote } from '@/app/actions/get-data'
import { createProductType } from '@/app/actions/admin'
import { toast } from 'sonner'
import { POSE_SPACING_MM, MARGE_COMMERCIALE_PERCENT, MARGE_SOPANO_PERCENT } from '@/lib/constants'
import { calculateCosts } from '@/lib/calculation/costs'
import { useCalculatorForm } from './useCalculatorForm'
import { useAccessories } from './useAccessories'
import { useConsumables } from './useConsumables'
import { formatCuttingDetails, formatAssemblyDetails, formatPackDetails } from '@/lib/format'
import type { ProductType, Plate, Accessory, Consumable, ImpositionResult, ScreenState, Quote, ProductSlot, ProductSlotResult } from '@/types/calculator'
import { DEFAULT_PRODUCT_SLOT } from '@/types/calculator'
import { createAccessory } from '@/app/actions/accessories'
import { v4 as uuidv4 } from 'uuid'

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



  const {
    formState,
    setField,
    loadQuote,
    resetForm,
    addProduct,
    removeProduct,
    setActiveProduct,
    updateProduct,
  } = useCalculatorForm()

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
    printSetupType,
    cuttingSetupType,
    hasImpression,
    hasFaconnage,
    hasConditionnement,
    hasAccessoires,
    hasBE,
    beTimeMinutes,
    batTimeMinutes,
    isMultiProduct,
    products,
    activeProductIndex,
    hasDossierFee,
    showMargeCommerciale,
    showMargeSopano,
  } = formState

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

  useEffect(() => {
    if (!initialQuote) return

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
      printSetupType: (initialQuote.printSetupType as 'none' | 'standard' | 'complexe') ?? 'none',
      cuttingSetupType: (initialQuote.cuttingSetupType as 'none' | 'standard' | 'complexe') ?? 'none',
      hasImpression: initialQuote.hasImpression ?? true,
      hasFaconnage: initialQuote.hasFaconnage ?? true,
      hasConditionnement: initialQuote.hasConditionnement ?? true,
      hasAccessoires: initialQuote.hasAccessoires ?? false,
      isMultiProduct: initialQuote.isMultiProduct ?? false,
      showMargeCommerciale: initialQuote.showMargeCommerciale ?? false,
      showMargeSopano: initialQuote.showMargeSopano ?? false,
      products: initialQuote.products?.map((p) => ({
        id: uuidv4(),
        productTypeId: p.productTypeId?.toString() || '',
        productSearch: p.productTypeName || '',
        flatWidth: p.flatWidth || 0,
        flatHeight: p.flatHeight || 0,
        quantity: p.quantity || 0,
        selectedPlateId: p.plateId?.toString() || '',
        printMode: (p.printMode as 'production' | 'quality') || 'production',
        isRectoVerso: p.isRectoVerso || false,
        rectoVersoType: p.rectoVersoType || null,
        inkMlPerPlate: p.inkMlPerPlate || 0,
        varnishSurfacePercent: p.varnishSurfacePercent || 0,
        flatColorSurfacePercent: p.flatColorSurfacePercent || 0,
        hasVarnish: p.hasVarnish || false,
        hasFlatColor: p.hasFlatColor || false,
        hasImpression: p.hasImpression ?? true,
        printSetupType: (p.printSetupType as 'none' | 'standard' | 'complexe') ?? 'none',
        cuttingSetupType: (p.cuttingSetupType as 'none' | 'standard' | 'complexe') ?? 'none',
        cuttingTimePerPoseSeconds: p.cuttingTimePerPoseSeconds || 0,
      })) || [],
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuote])

  const selectedPlate = plates.find((p) => p.id.toString() === selectedPlateId)
  const selectedProductType = productTypes.find((pt) => pt.id.toString() === selectedProductTypeId)
  const packagingPlate = plates.find((p) => p.id.toString() === packagingPlateId)
  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM

  useEffect(() => {
    if (isMultiProduct) return
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
  }, [flatWidth, flatHeight, quantity, selectedPlate, poseSpacingMm, isMultiProduct])

  const productSlotResults: ProductSlotResult[] = isMultiProduct
    ? products.map((slot) => {
        const plate = plates.find((p) => p.id.toString() === slot.selectedPlateId)
        let slotImposition: ImpositionResult | null = null

        if (plate && slot.flatWidth > 0 && slot.flatHeight > 0 && slot.quantity > 0) {
          const imp = calculateImposition(
            { width: slot.flatWidth, height: slot.flatHeight },
            { width: plate.width, height: plate.height },
            poseSpacingMm
          )
          const platesNeeded = Math.ceil(slot.quantity / imp.itemsPerPlate) || 0
          slotImposition = {
            itemsPerPlate: imp.itemsPerPlate,
            platesNeeded,
            materialCost: platesNeeded * plate.cost,
            orientation: imp.orientation,
            layout: imp.layout,
          }
        }

        const slotCosts = calculateCosts({
          quantity: slot.quantity,
          impositionResult: slotImposition,
          selectedPlate: plate,
          inkMlPerPlate: slot.inkMlPerPlate,
          varnishSurfacePercent: slot.varnishSurfacePercent,
          flatColorSurfacePercent: slot.flatColorSurfacePercent,
          printMode: slot.printMode,
          isRectoVerso: slot.isRectoVerso,
          hasVarnish: slot.hasVarnish,
          hasFlatColor: slot.hasFlatColor,
          printSetupType: slot.printSetupType,
          cuttingSetupType: slot.cuttingSetupType,
          hasImpression: slot.hasImpression,
          hasFaconnage: false,
          hasConditionnement: false,
          hasAccessoires: false,
          cuttingTimePerPoseSeconds: slot.cuttingTimePerPoseSeconds,
          assemblyTimePerPieceSeconds: 0,
          packTimePerPieceSeconds: 0,
          hasAssemblyNotice: false,
          selectedAccessories: [],
          selectedConsumables: [],
          settings,
          hasPackaging: false,
          packagingPlate: undefined,
          packagingQuantity: 0,
          packagingCuttingTimePerPoseSeconds: 20,
          packagingWidth: 0,
          packagingHeight: 0,
          hasDossierFee,
        })

        return {
          slot,
          impositionResult: slotImposition,
          costResult: {
            materialCost: slotImposition?.materialCost || 0,
            printingCost: slotCosts.printingCost,
            printingCostData: slotCosts.printingCostData,
            cuttingCost: slotCosts.cuttingCost,
            cuttingMachineCost: slotCosts.cuttingMachineCost,
            cuttingSetupCost: slotCosts.cuttingSetupCost,
            cuttingMachineTimeMin: slotCosts.cuttingMachineTimeMin,
            cuttingSetupTimeMin: slotCosts.cuttingSetupTimeMin,
            inkVolumeL: slotCosts.inkVolumeL,
            subtotal: slotCosts.totalCost,
          },
        }
      })
    : []

  const totalQuantityMulti = isMultiProduct
    ? products.reduce((sum, p) => sum + p.quantity, 0)
    : 0

  const costResult = calculateCosts({
    quantity: isMultiProduct ? totalQuantityMulti : quantity,
    impositionResult: isMultiProduct ? null : impositionResult,
    selectedPlate: isMultiProduct ? undefined : selectedPlate,
    inkMlPerPlate: isMultiProduct ? 0 : inkMlPerPlate,
    varnishSurfacePercent: isMultiProduct ? 0 : varnishSurfacePercent,
    flatColorSurfacePercent: isMultiProduct ? 0 : flatColorSurfacePercent,
    printMode: isMultiProduct ? 'production' : printMode,
    isRectoVerso: isMultiProduct ? false : isRectoVerso,
    hasVarnish: isMultiProduct ? false : hasVarnish,
    hasFlatColor: isMultiProduct ? false : hasFlatColor,
    printSetupType: isMultiProduct ? 'none' : printSetupType,
    cuttingSetupType: isMultiProduct ? 'none' : cuttingSetupType,
    hasImpression: isMultiProduct ? false : hasImpression,
    hasFaconnage,
    hasConditionnement,
    hasAccessoires,
    cuttingTimePerPoseSeconds: isMultiProduct ? 0 : cuttingTimePerPoseSeconds,
    assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds,
    hasAssemblyNotice,
    selectedAccessories,
    selectedConsumables,
    settings,
    hasPackaging,
    hasBE,
    beTimeMinutes,
    batTimeMinutes,
    hasDossierFee,
    packagingPlate,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth,
    packagingHeight,
  })

  const multiProductsSubtotal = productSlotResults.reduce(
    (sum, r) => sum + r.costResult.subtotal, 0
  )
  const totalCostMulti = multiProductsSubtotal + costResult.totalCost

  // ── Calcul des marges internes ──
  const displayTotalForMarges = isMultiProduct ? totalCostMulti : costResult.totalCost
  const margeCommercialeMontant = showMargeCommerciale ? displayTotalForMarges * (MARGE_COMMERCIALE_PERCENT / 100) : 0
  const margeSopanoMontant = showMargeSopano ? displayTotalForMarges * (MARGE_SOPANO_PERCENT / 100) : 0
  const totalNet = displayTotalForMarges - margeCommercialeMontant - margeSopanoMontant

  const getCuttingDetails = useCallback(() => formatCuttingDetails({
    cuttingMachineTimeMin: costResult.cuttingMachineTimeMin,
    cuttingSetupTimeMin: costResult.cuttingSetupTimeMin,
    cuttingSetupType,
    cuttingTimePerPoseSeconds,
  }), [costResult.cuttingMachineTimeMin, costResult.cuttingSetupTimeMin, cuttingSetupType, cuttingTimePerPoseSeconds])

  const getAssemblyDetails = useCallback(() => formatAssemblyDetails({
    assemblyTimePerPieceSeconds,
    quantity: isMultiProduct ? totalQuantityMulti : quantity,
  }), [assemblyTimePerPieceSeconds, quantity, isMultiProduct, totalQuantityMulti])

  const getPackDetails = useCallback(() => formatPackDetails({
    packTimePerPieceSeconds,
    quantity: isMultiProduct ? totalQuantityMulti : quantity,
    hasAssemblyNotice,
    assemblyNoticeCostPerPiece: costResult.assemblyNoticeCostPerPiece,
  }), [packTimePerPieceSeconds, quantity, isMultiProduct, totalQuantityMulti, hasAssemblyNotice, costResult.assemblyNoticeCostPerPiece])

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

  const handleCreateAccessory = async (name: string, price: number) => {
    try {
      const newAccessory = await createAccessory({ name, price })
      toast.success(`Accessoire "${name}" créé`)
      return newAccessory
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la création de l\'accessoire')
      return null
    }
  }

  const handleSave = async () => {
    if (isMultiProduct) {
      if (products.length === 0) {
        toast.error('Ajoutez au moins un produit.')
        return
      }
      const incomplete = products.find(
        (p) => !p.productTypeId || !p.selectedPlateId || p.flatWidth <= 0 || p.flatHeight <= 0 || p.quantity <= 0
      )
      if (incomplete) {
        toast.error('Tous les produits doivent être complétés.')
        return
      }
    } else {
      const parsedProductId = parseInt(selectedProductTypeId)
      if (!impositionResult || !selectedPlateId || !selectedProductTypeId || isNaN(parsedProductId)) {
        toast.error('Veuillez sélectionner un Type de PLV valide.')
        return
      }
    }

    setIsServing(true)
    try {
      const parsedProductId = isMultiProduct ? 0 : parseInt(selectedProductTypeId)

      await createQuote({
        studyNumber,
        productTypeId: isMultiProduct ? parseInt(products[0].productTypeId) : parsedProductId,
        quantity: isMultiProduct ? totalQuantityMulti : quantity,
        plateId: isMultiProduct ? parseInt(products[0].selectedPlateId) : parseInt(selectedPlateId),
        itemsPerPlate: isMultiProduct
          ? (productSlotResults[0]?.impositionResult?.itemsPerPlate || 0)
          : (impositionResult?.itemsPerPlate || 0),
        platesCount: isMultiProduct
          ? (productSlotResults[0]?.impositionResult?.platesNeeded || 0)
          : (impositionResult?.platesNeeded || 0),
        totalCost: isMultiProduct ? totalCostMulti : costResult.totalCost,
        flatWidth: isMultiProduct ? products[0].flatWidth : flatWidth,
        flatHeight: isMultiProduct ? products[0].flatHeight : flatHeight,
        inkMlPerPlate: isMultiProduct ? 0 : inkMlPerPlate,
        varnishSurfacePercent: isMultiProduct ? 0 : varnishSurfacePercent,
        flatColorSurfacePercent: isMultiProduct ? 0 : flatColorSurfacePercent,
        printMode: isMultiProduct ? 'production' : printMode,
        isRectoVerso: isMultiProduct ? false : isRectoVerso,
        rectoVersoType: isMultiProduct ? null : rectoVersoType,
        hasVarnish: isMultiProduct ? false : hasVarnish,
        hasFlatColor: isMultiProduct ? false : hasFlatColor,
        cuttingTimePerPoseSeconds: isMultiProduct ? 0 : cuttingTimePerPoseSeconds,
        assemblyTimePerPieceSeconds,
        packTimePerPieceSeconds,
        hasAssemblyNotice,
        hasPackaging,
        packagingPlateId: packagingPlateId ? parseInt(packagingPlateId) : null,
        packagingQuantity: packagingQuantity || null,
        packagingCuttingTimePerPoseSeconds,
        packagingWidth: packagingWidth || null,
        packagingHeight: packagingHeight || null,
        printSetupType: isMultiProduct ? 'none' : printSetupType,
        cuttingSetupType: isMultiProduct ? 'none' : cuttingSetupType,
        hasImpression: isMultiProduct ? false : hasImpression,
        hasFaconnage,
        hasConditionnement,
        hasAccessoires,
        hasBE,
        beTimeMinutes,
        batTimeMinutes,
        isMultiProduct,
        showMargeCommerciale,
        showMargeSopano,
        elements: isMultiProduct ? [] : (selectedProductType?.elements.map((el) => ({
          name: el.name,
          quantity: el.quantity,
        })) || []),
        accessories: selectedAccessories.map((sa) => ({
          id: sa.id,
          quantity: sa.quantity,
        })),
        consumables: selectedConsumables.map((sc) => ({
          id: sc.id,
          sizePerItem: sc.sizePerItem,
        })),
        parentReference: initialQuote?.reference || undefined,
        products: isMultiProduct ? products.map((p, i) => ({
          position: i,
          productTypeId: parseInt(p.productTypeId) || null,
          productTypeName: p.productSearch,
          flatWidth: p.flatWidth,
          flatHeight: p.flatHeight,
          quantity: p.quantity,
          plateId: parseInt(p.selectedPlateId) || null,
          itemsPerPlate: productSlotResults[i]?.impositionResult?.itemsPerPlate || null,
          platesCount: productSlotResults[i]?.impositionResult?.platesNeeded || null,
          printMode: p.printMode,
          isRectoVerso: p.isRectoVerso,
          rectoVersoType: p.rectoVersoType,
          inkMlPerPlate: p.inkMlPerPlate,
          varnishSurfacePercent: p.varnishSurfacePercent,
          flatColorSurfacePercent: p.flatColorSurfacePercent,
          hasVarnish: p.hasVarnish,
          hasFlatColor: p.hasFlatColor,
          hasImpression: p.hasImpression,
          printSetupType: p.printSetupType,
          cuttingSetupType: p.cuttingSetupType,
          cuttingTimePerPoseSeconds: p.cuttingTimePerPoseSeconds,
          totalCost: productSlotResults[i]?.costResult.subtotal || null,
        })) : [],
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
    hasImpression, setHasImpression: (v: boolean) => setField('hasImpression', v),
    printSetupType, setPrintSetupType: (v: 'none' | 'standard' | 'complexe') => setField('printSetupType', v),
    cuttingSetupType, setCuttingSetupType: (v: 'none' | 'standard' | 'complexe') => setField('cuttingSetupType', v),
    cuttingTimePerPoseSeconds, setCuttingTimePerPoseSeconds: (v: number) => setField('cuttingTimePerPoseSeconds', v),
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
    hasBE, setHasBE: (v: boolean) => setField('hasBE', v),
    beTimeMinutes, setBeTimeMinutes: (v: number) => setField('beTimeMinutes', v),
    batTimeMinutes, setBatTimeMinutes: (v: number) => setField('batTimeMinutes', v),
    packagingPlateId, setPackagingPlateId: (v: string) => setField('packagingPlateId', v),
    packagingQuantity, setPackagingQuantity: (v: number) => setField('packagingQuantity', v),
    packagingCuttingTimePerPoseSeconds, setPackagingCuttingTimePerPoseSeconds: (v: number) => setField('packagingCuttingTimePerPoseSeconds', v),
    packagingWidth, setPackagingWidth: (v: number) => setField('packagingWidth', v),
    packagingHeight, setPackagingHeight: (v: number) => setField('packagingHeight', v),
    hasDossierFee, setHasDossierFee: (v: boolean) => setField('hasDossierFee', v),
    handleAddAccessory, handleRemoveAccessory,
    handleAddConsumable, handleRemoveConsumable,
    handleCreateProductType, handleCreateAccessory, handleSave, handleReset,
    getCuttingDetails, getAssemblyDetails, getPackDetails,
    formState,
    costResult,
    isMultiProduct, setIsMultiProduct: (v: boolean) => setField('isMultiProduct', v),
    products,
    activeProductIndex,
    productSlotResults,
    totalQuantityMulti,
    totalCostMulti,
    addProduct,
    removeProduct,
    setActiveProduct,
    updateProduct,
    showMargeCommerciale, setShowMargeCommerciale: (v: boolean) => setField('showMargeCommerciale', v),
    showMargeSopano, setShowMargeSopano: (v: boolean) => setField('showMargeSopano', v),
    margeCommercialeMontant,
    margeSopanoMontant,
    totalNet,
    settings,
    setField,
  }
}