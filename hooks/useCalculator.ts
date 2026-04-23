'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { createQuote } from '@/app/actions/quotes'
import { createProductType } from '@/app/actions/catalog'
import { toast } from 'sonner'
import { POSE_SPACING_MM, PLATE_BORDER_MM, MARGE_COMMERCIALE_PERCENT, MARGE_SOPANO_PERCENT } from '@/lib/config/pricing'
import { calculateCosts } from '@/lib/calculation/costs'
import { calculateTransport, type TransportMode } from '@/lib/transport/geodis-rates'
import { GEODIS_FUEL_SURCHARGE_PERCENT } from '@/lib/config/pricing'
import { useCalculatorForm } from './useCalculatorForm'
import { useAccessories } from './useAccessories'
import { useConsumables } from './useConsumables'
import { formatCuttingDetails, formatAssemblyDetails, formatPackDetails } from '@/lib/format'
import type { ProductType, Plate, Accessory, Consumable, ImpositionResult, ScreenState, Quote, ProductSlotResult, TransportDeliveryForm } from '@/types/calculator'
import type { PackagingRulesData } from '@/app/actions/reference-data'
import { DEFAULT_PRODUCT_SLOT } from '@/types/calculator'
import { createAccessory } from '@/app/actions/accessories'
import { v4 as uuidv4 } from 'uuid'

function resolveVerso(
  isRectoVerso: boolean,
  rectoVersoType: string | null,
  inkMlPerPlate: number,
  inkMlVerso: number
) {
  const isDifferent = isRectoVerso && rectoVersoType === 'different' && inkMlVerso > 0
  return {
    effectiveInkMl: isDifferent ? inkMlPerPlate + inkMlVerso : inkMlPerPlate,
    effectiveIsRectoVerso: isRectoVerso && (rectoVersoType !== 'different' || inkMlVerso === 0),
  }
}

export function useCalculator(
  initialProductTypes: ProductType[],
  plates: Plate[],
  accessories: Accessory[],
  consumables: Consumable[],
  initialQuote?: Quote,
  isViewOnly?: boolean,
  settings?: Record<string, number>,
  packagingRules?: PackagingRulesData
) {
  const [screenState, setScreenState] = useState<ScreenState>('form')
  const [isServing, setIsServing] = useState(false)
  const [productTypes, setProductTypes] = useState(initialProductTypes)
  const [impositionResult, setImpositionResult] = useState<ImpositionResult | null>(null)
  const [orientationOverride, setOrientationOverride] = useState<'normal' | 'rotated' | null>(null)
  const quoteLoaded = useRef(false)



  const {
    formState,
    setField,
    loadQuote,
    resetForm,
    addProduct,
    removeProduct,
    setActiveProduct,
    updateProduct,
    addTransportDelivery,
    removeTransportDelivery,
    updateTransportDelivery,
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
    inkMlVerso,
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
    packagingBoxType,
    packagingMaterialType,
    packagingExternalSize,
    packagingProductLength,
    packagingProductWidth,
    packagingProductHeight,
    packagingProductThickness,
    packagingPlateId,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
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
    if (!initialQuote || quoteLoaded.current) return
    quoteLoaded.current = true

    loadQuote({
      studyNumber: initialQuote.study?.number || 'ET',
      client: initialQuote.client || '',
      selectedProductTypeId: initialQuote.productTypeId?.toString() || '',
      quantity: initialQuote.quantity,
      selectedPlateId: initialQuote.plateId?.toString() || '',
      flatWidth: initialQuote.flatWidth || 0,
      flatHeight: initialQuote.flatHeight || 0,
      inkMlPerPlate: initialQuote.inkMlPerPlate ?? 20,
      inkMlVerso: initialQuote.inkMlVerso ?? 0,
      varnishSurfacePercent: initialQuote.varnishSurfacePercent ?? 0,
      flatColorSurfacePercent: initialQuote.flatColorSurfacePercent ?? 0,
      printMode: (initialQuote.printMode as 'production' | 'quality') || 'production',
      isRectoVerso: initialQuote.isRectoVerso || false,
      rectoVersoType: (initialQuote.rectoVersoType as 'identical' | 'different' | null) || null,
      hasVarnish: initialQuote.hasVarnish || false,
      hasFlatColor: initialQuote.hasFlatColor || false,
      cuttingTimePerPoseSeconds: initialQuote.cuttingTimePerPoseSeconds || 0,
      assemblyTimePerPieceSeconds: initialQuote.assemblyTimePerPieceSeconds || 0,
      packTimePerPieceSeconds: initialQuote.packTimePerPieceSeconds || 0,
      hasAssemblyNotice: initialQuote.hasAssemblyNotice || false,
      hasPackaging: initialQuote.hasPackaging || false,
      packagingBoxType: (initialQuote.packagingBoxType as 'etui' | 'caisse' | 'plaque_rainee') || 'etui',
      packagingMaterialType: (initialQuote.packagingMaterialType as 'B' | 'EB' | 'C' | 'BC') || 'BC',
      packagingExternalSize: (initialQuote.packagingExternalSize as 'petit' | 'moyen' | 'grand' | null) || null,
      packagingProductLength: initialQuote.packagingProductLength || 0,
      packagingProductWidth: initialQuote.packagingProductWidth || 0,
      packagingProductHeight: initialQuote.packagingProductHeight || 0,
      packagingProductThickness: initialQuote.packagingProductThickness || 0,
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
      hasBE: initialQuote.hasBE ?? false,
      beTimeMinutes: initialQuote.beTimeMinutes ?? 0,
      batTimeMinutes: initialQuote.batTimeMinutes ?? 0,
      hasDossierFee: initialQuote.hasDossierFee ?? false,
      plateCostOverride: initialQuote.plateCostOverride ?? null,
      customPlate: initialQuote.customPlateName && initialQuote.customPlateWidth && initialQuote.customPlateHeight && initialQuote.customPlateCost
        ? { name: initialQuote.customPlateName, width: initialQuote.customPlateWidth, height: initialQuote.customPlateHeight, cost: initialQuote.customPlateCost }
        : null,
      showMargeCommerciale: initialQuote.showMargeCommerciale ?? false,
      showMargeSopano: initialQuote.showMargeSopano ?? false,
      transportDeliveries: initialQuote.transportDeliveries?.map((d): TransportDeliveryForm => ({
        id: uuidv4(),
        mode: d.transportMode as 'PACK30' | 'MESSAGERIE_PLUS' | 'AFFRETEMENT' | undefined,
        department: d.department,
        weightKg: d.weightKg ?? undefined,
        units: d.units,
        optionsHT: d.optionsHT,
      })) || [],
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
        rectoVersoType: (p.rectoVersoType as 'identical' | 'different' | null) || null,
        inkMlPerPlate: p.inkMlPerPlate || 0,
        inkMlVerso: p.inkMlVerso || 0,
        varnishSurfacePercent: p.varnishSurfacePercent || 0,
        flatColorSurfacePercent: p.flatColorSurfacePercent || 0,
        hasVarnish: p.hasVarnish || false,
        hasFlatColor: p.hasFlatColor || false,
        hasImpression: p.hasImpression ?? true,
        printSetupType: (p.printSetupType as 'none' | 'standard' | 'complexe') ?? 'none',
        cuttingSetupType: (p.cuttingSetupType as 'none' | 'standard' | 'complexe') ?? 'none',
        cuttingTimePerPoseSeconds: p.cuttingTimePerPoseSeconds || 0,
        orientationOverride: null,
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

    if (isViewOnly) setScreenState('recap')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuote])

  const selectedPlateBase = plates.find((p) => p.id.toString() === selectedPlateId)
  const plateCostOverride = formState.plateCostOverride
  const customPlate = formState.customPlate
  // Matière personnalisée > prix négocié > plaque catalogue
  const selectedPlate = customPlate
    ? { id: -1, name: customPlate.name, width: customPlate.width, height: customPlate.height, cost: customPlate.cost, material: customPlate.name }
    : selectedPlateBase
      ? plateCostOverride !== null && plateCostOverride > 0
        ? { ...selectedPlateBase, cost: plateCostOverride }
        : selectedPlateBase
      : undefined
  const selectedProductType = productTypes.find((pt) => pt.id.toString() === selectedProductTypeId)
  const packagingPlate = plates.find((p) => p.id.toString() === packagingPlateId)

  // ── Dimensions emballage ──
  // En multi-produit : on prend le plus grand produit (par surface à plat)
  const largestProduct = isMultiProduct && products.length > 0
    ? products.reduce((max, p) =>
        p.flatWidth * p.flatHeight > max.flatWidth * max.flatHeight ? p : max,
        products[0]
      )
    : null

  const effectivePackagingProductLength = isMultiProduct && largestProduct
    ? largestProduct.flatHeight
    : packagingProductLength
  const effectivePackagingProductWidth = isMultiProduct && largestProduct
    ? largestProduct.flatWidth
    : packagingProductWidth

  const computedPackagingDimensions = (() => {
    const L = effectivePackagingProductLength
    const W = effectivePackagingProductWidth
    const H = packagingProductHeight
    const T = packagingProductThickness
    if (L <= 0 || W <= 0) return { width: 0, height: 0 }
    switch (packagingBoxType) {
      case 'etui':
        return { width: 2 * W + 2 * T, height: L + 2 * T + 100 }
      case 'caisse':
        if (H <= 0) return { width: 0, height: 0 }
        return { width: H + W, height: 2 * L + 2 * W + 50 }
      case 'plaque_rainee':
        return { width: W, height: 2 * L }
      default:
        return { width: 0, height: 0 }
    }
  })()
  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM
  const plateBorderMm = settings?.PLATE_BORDER_MM ?? PLATE_BORDER_MM

  useEffect(() => {
    if (isMultiProduct) return
    if (selectedPlate && flatWidth > 0 && flatHeight > 0 && quantity > 0) {
      const imp = calculateImposition(
        { width: flatWidth, height: flatHeight },
        { width: selectedPlate.width, height: selectedPlate.height },
        poseSpacingMm,
        orientationOverride ?? undefined,
        plateBorderMm
      )
      const platesNeeded = imp.itemsPerPlate > 0 ? Math.ceil(quantity / imp.itemsPerPlate) : 0
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
  }, [flatWidth, flatHeight, quantity, selectedPlate, poseSpacingMm, isMultiProduct, orientationOverride])

  const productSlotResults: ProductSlotResult[] = isMultiProduct
    ? products.map((slot) => {
        const plate = plates.find((p) => p.id.toString() === slot.selectedPlateId)
        let slotImposition: ImpositionResult | null = null

        if (plate && slot.flatWidth > 0 && slot.flatHeight > 0 && slot.quantity > 0) {
          const imp = calculateImposition(
            { width: slot.flatWidth, height: slot.flatHeight },
            { width: plate.width, height: plate.height },
            poseSpacingMm,
            slot.orientationOverride ?? undefined,
            plateBorderMm
          )
          const platesNeeded = imp.itemsPerPlate > 0 ? Math.ceil(slot.quantity / imp.itemsPerPlate) : 0
          slotImposition = {
            itemsPerPlate: imp.itemsPerPlate,
            platesNeeded,
            materialCost: platesNeeded * plate.cost,
            orientation: imp.orientation,
            layout: imp.layout,
          }
        }

        const { effectiveInkMl: slotEffectiveInkMl, effectiveIsRectoVerso: slotEffectiveIsRectoVerso } =
          resolveVerso(slot.isRectoVerso, slot.rectoVersoType, slot.inkMlPerPlate, slot.inkMlVerso)

        const slotCosts = calculateCosts({
          quantity: slot.quantity,
          impositionResult: slotImposition,
          selectedPlate: plate,
          inkMlPerPlate: slotEffectiveInkMl,
          varnishSurfacePercent: slot.varnishSurfacePercent,
          flatColorSurfacePercent: slot.flatColorSurfacePercent,
          printMode: slot.printMode,
          isRectoVerso: slotEffectiveIsRectoVerso,
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
          hasDossierFee: false,
        })

        return {
          slot,
          impositionResult: slotImposition,
          costResult: {
            materialCost: slotCosts.materialCostRaw,
            materialCostMarged: slotCosts.materialCostMarged,
            materialMarginCoeff: slotCosts.materialMarginCoeff,
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

  const fuelSurchargePct = settings?.GEODIS_FUEL_SURCHARGE_PERCENT ?? GEODIS_FUEL_SURCHARGE_PERCENT
  const transportTotal = formState.transportDeliveries.reduce((sum, d) => {
    if (!d.mode || !d.department || d.units === undefined) return sum
    if (d.mode !== 'AFFRETEMENT' && d.weightKg === undefined) return sum
    const calc = calculateTransport(
      d.mode as TransportMode,
      d.department,
      d.weightKg || 0,
      d.units,
      fuelSurchargePct,
      d.optionsHT || 0
    )
    return sum + (calc?.total ?? 0)
  }, 0)

  // Pour recto-verso "différent" avec jauge verso renseignée : encre = recto+verso, multiplier=1
  // Si inkMlVerso=0 (anciens devis sauvegardés avant la jauge verso) : comportement legacy multiplier=2
  const { effectiveInkMl: effectiveInkMlPerPlate, effectiveIsRectoVerso } =
    resolveVerso(isRectoVerso, rectoVersoType, inkMlPerPlate, inkMlVerso)

  // ── Prix unitaire B/EB depuis PackagingPricingRule (avec coefficient quantité) ──
  const settingsWithPackagingPrice = (() => {
    const isExternal = packagingMaterialType === 'B' || packagingMaterialType === 'EB'
    if (!isExternal || !packagingExternalSize || packagingQuantity <= 0) return settings
    if (!packagingRules?.rules?.length) return settings

    const category = (packagingBoxType || 'etui').toUpperCase()
    const mat = packagingMaterialType.toUpperCase()
    const sz = packagingExternalSize.toUpperCase()
    const rule = packagingRules.rules.find(
      (r) => r.category === category && r.material === mat && r.size === sz
    )
    if (!rule) return settings

    let price = rule.baseUnitPrice
    if (packagingRules.coefficients?.length) {
      const band = packagingRules.coefficients.find(
        (c) => packagingQuantity >= c.minQuantity && (c.maxQuantity === null || packagingQuantity <= c.maxQuantity)
      )
      if (band) price = Math.round(price * band.coefficient * 10000) / 10000
    }

    const key = `PACKAGING_${mat}_${sz}_PRICE`
    return { ...settings, [key]: price }
  })()

  const costResult = calculateCosts({
    quantity: isMultiProduct ? totalQuantityMulti : quantity,
    impositionResult: isMultiProduct ? null : impositionResult,
    selectedPlate: isMultiProduct ? undefined : selectedPlate,
    inkMlPerPlate: isMultiProduct ? 0 : effectiveInkMlPerPlate,
    varnishSurfacePercent: isMultiProduct ? 0 : varnishSurfacePercent,
    flatColorSurfacePercent: isMultiProduct ? 0 : flatColorSurfacePercent,
    printMode: isMultiProduct ? 'production' : printMode,
    isRectoVerso: isMultiProduct ? false : effectiveIsRectoVerso,
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
    settings: settingsWithPackagingPrice,
    hasPackaging,
    packagingMaterialType,
    packagingExternalSize,
    hasBE,
    beTimeMinutes,
    batTimeMinutes,
    hasDossierFee,
    packagingPlate,
    packagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    packagingWidth: computedPackagingDimensions.width,
    packagingHeight: computedPackagingDimensions.height,
    transportTotal: transportTotal > 0 ? transportTotal : undefined,
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

  const applyTemplate = useCallback((template: ProductType['templates'][number]) => {
    if (template.flatWidth) setField('flatWidth', template.flatWidth)
    if (template.flatHeight) setField('flatHeight', template.flatHeight)
    if (template.plateId) setField('selectedPlateId', template.plateId.toString())
    setField('hasImpression', template.hasImpression)
    setField('printMode', template.printMode as 'production' | 'quality')
    setField('printSetupType', template.printSetupType as 'none' | 'standard' | 'complexe')
    setField('isRectoVerso', template.isRectoVerso)
    setField('rectoVersoType', (template.rectoVersoType ?? null) as 'identical' | 'different' | null)
    setField('hasVarnish', template.hasVarnish)
    setField('hasFlatColor', template.hasFlatColor)
    setField('inkMlPerPlate', template.inkMlPerPlate)
    setField('inkMlVerso', template.inkMlVerso)
    setField('varnishSurfacePercent', template.varnishSurfacePercent)
    setField('flatColorSurfacePercent', template.flatColorSurfacePercent)
    setField('cuttingTimePerPoseSeconds', template.cuttingTimePerPoseSeconds)
    setField('cuttingSetupType', template.cuttingSetupType as 'none' | 'standard' | 'complexe')
    setField('hasFaconnage', template.hasFaconnage)
    setField('assemblyTimePerPieceSeconds', template.assemblyTimePerPieceSeconds)
    setField('hasConditionnement', template.hasConditionnement)
    setField('packTimePerPieceSeconds', template.packTimePerPieceSeconds)
    setField('hasAssemblyNotice', template.hasAssemblyNotice)
    setField('hasAccessoires', template.hasAccessoires)
    // Pré-remplir les accessoires si le template en a
    if (template.accessories.length > 0) {
      setSelectedAccessories(template.accessories.map((a) => ({
        id: a.accessory.id,
        name: a.accessory.name,
        price: a.accessory.price,
        quantity: a.quantity,
      })))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setField])

  const handleCreateProductType = async () => {
    if (!productSearch) return
    try {
      const newType = await createProductType(productSearch)
      if (!productTypes.find((pt) => pt.id === newType.id)) {
        setProductTypes([
          ...productTypes,
          { ...newType, flatWidthFormula: 'l', flatHeightFormula: 'L', elements: [], templates: [] },
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

  const handleCreateProductTypeForSlot = async (slotIndex: number, name: string) => {
    if (!name.trim()) return
    try {
      const newType = await createProductType(name.trim())
      if (!productTypes.find((pt) => pt.id === newType.id)) {
        setProductTypes([
          ...productTypes,
          { ...newType, flatWidthFormula: 'l', flatHeightFormula: 'L', elements: [], templates: [] },
        ])
      }
      updateProduct(slotIndex, 'productTypeId', newType.id.toString())
      updateProduct(slotIndex, 'productSearch', newType.name)
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
        client: formState.client || undefined,
        productTypeId: isMultiProduct ? parseInt(products[0].productTypeId) : parsedProductId,
        quantity: isMultiProduct ? totalQuantityMulti : quantity,
        plateId: customPlate ? null : (isMultiProduct ? parseInt(products[0].selectedPlateId) : parseInt(selectedPlateId)),
        customPlateName: customPlate?.name ?? null,
        customPlateWidth: customPlate?.width ?? null,
        customPlateHeight: customPlate?.height ?? null,
        customPlateCost: customPlate?.cost ?? null,
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
        inkMlVerso: isMultiProduct ? 0 : inkMlVerso,
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
        packagingBoxType,
        packagingMaterialType,
        packagingExternalSize,
        packagingProductLength: packagingProductLength || null,
        packagingProductWidth: packagingProductWidth || null,
        packagingProductHeight: packagingProductHeight || null,
        packagingProductThickness: packagingProductThickness || null,
        packagingPlateId: packagingPlateId ? parseInt(packagingPlateId) : null,
        packagingQuantity: packagingQuantity || null,
        packagingCuttingTimePerPoseSeconds,
        packagingWidth: computedPackagingDimensions.width || null,
        packagingHeight: computedPackagingDimensions.height || null,
        printSetupType: isMultiProduct ? 'none' : printSetupType,
        cuttingSetupType: isMultiProduct ? 'none' : cuttingSetupType,
        hasImpression: isMultiProduct ? false : hasImpression,
        hasFaconnage,
        hasConditionnement,
        hasAccessoires,
        hasBE,
        beTimeMinutes,
        batTimeMinutes,
        hasDossierFee,
        plateCostOverride: plateCostOverride ?? null,
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
        transportTotal: transportTotal > 0 ? transportTotal : undefined,
        transportDeliveries: formState.transportDeliveries
          .filter(d => d.mode && d.department && d.units)
          .map(d => {
            const c = calculateTransport(
              d.mode as TransportMode,
              d.department!,
              d.weightKg || 0,
              d.units,
              fuelSurchargePct,
              d.optionsHT || 0
            )
            return {
              transportMode: d.mode!,
              department: d.department!,
              weightKg: d.weightKg ?? null,
              units: d.units,
              optionsHT: d.optionsHT,
              basePriceHT: c?.basePrice ?? 0,
              totalHT: c?.total ?? 0,
            }
          }),
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
    orientationOverride, setOrientationOverride,
    inkMlPerPlate, setInkMlPerPlate: (v: number) => setField('inkMlPerPlate', v),
    inkMlVerso, setInkMlVerso: (v: number) => setField('inkMlVerso', v),
    varnishSurfacePercent, setVarnishSurfacePercent: (v: number) => setField('varnishSurfacePercent', v),
    flatColorSurfacePercent, setFlatColorSurfacePercent: (v: number) => setField('flatColorSurfacePercent', v),
    printMode, setPrintMode: (v: 'production' | 'quality') => setField('printMode', v),
    isRectoVerso, setIsRectoVerso: (v: boolean) => setField('isRectoVerso', v),
    hasVarnish, setHasVarnish: (v: boolean) => setField('hasVarnish', v),
    hasFlatColor, setHasFlatColor: (v: boolean) => setField('hasFlatColor', v),
    rectoVersoType, setRectoVersoType: (v: 'identical' | 'different' | null) => setField('rectoVersoType', v),
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
    packagingBoxType, setPackagingBoxType: (v: 'etui' | 'caisse' | 'plaque_rainee') => setField('packagingBoxType', v),
    packagingMaterialType, setPackagingMaterialType: (v: 'B' | 'EB' | 'C' | 'BC') => setField('packagingMaterialType', v),
    packagingExternalSize, setPackagingExternalSize: (v: 'petit' | 'moyen' | 'grand' | null) => setField('packagingExternalSize', v),
    packagingProductLength, setPackagingProductLength: (v: number) => setField('packagingProductLength', v),
    packagingProductWidth, setPackagingProductWidth: (v: number) => setField('packagingProductWidth', v),
    packagingProductHeight, setPackagingProductHeight: (v: number) => setField('packagingProductHeight', v),
    packagingProductThickness, setPackagingProductThickness: (v: number) => setField('packagingProductThickness', v),
    computedPackagingDimensions,
    largestProduct,
    hasBE, setHasBE: (v: boolean) => setField('hasBE', v),
    beTimeMinutes, setBeTimeMinutes: (v: number) => setField('beTimeMinutes', v),
    batTimeMinutes, setBatTimeMinutes: (v: number) => setField('batTimeMinutes', v),
    packagingPlateId, setPackagingPlateId: (v: string) => setField('packagingPlateId', v),
    packagingQuantity, setPackagingQuantity: (v: number) => setField('packagingQuantity', v),
    packagingCuttingTimePerPoseSeconds, setPackagingCuttingTimePerPoseSeconds: (v: number) => setField('packagingCuttingTimePerPoseSeconds', v),
    hasDossierFee, setHasDossierFee: (v: boolean) => setField('hasDossierFee', v),
    handleAddAccessory, handleRemoveAccessory,
    handleAddConsumable, handleRemoveConsumable,
    handleCreateProductType, handleCreateProductTypeForSlot, handleCreateAccessory, handleSave, handleReset, applyTemplate,
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
    addTransportDelivery,
    removeTransportDelivery,
    updateTransportDelivery,
    showMargeCommerciale, setShowMargeCommerciale: (v: boolean) => setField('showMargeCommerciale', v),
    showMargeSopano, setShowMargeSopano: (v: boolean) => setField('showMargeSopano', v),
    margeCommercialeMontant,
    margeSopanoMontant,
    totalNet,
    settings,
    setField,
    customPlate, setCustomPlate: (v: { name: string; width: number; height: number; cost: number } | null) => setField('customPlate', v),
  }
}
