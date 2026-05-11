'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { calculateImposition } from '@/lib/calculation/imposition'
import { createProductType } from '@/app/actions/catalog'
import { toast } from 'sonner'
import { POSE_SPACING_MM, PLATE_BORDER_MM, MARGE_COMMERCIALE_PERCENT, MARGE_SOPANO_PERCENT, GEODIS_FUEL_SURCHARGE_PERCENT } from '@/lib/config/pricing'
import { calculateCosts } from '@/lib/calculation/costs'
import { calculateTransport, type TransportMode } from '@/lib/transport/geodis-rates'
import { useCalculatorForm } from './useCalculatorForm'
import { useAccessories } from './useAccessories'
import { useConsumables } from './useConsumables'
import { formatCuttingDetails, formatAssemblyDetails, formatPackDetails } from '@/lib/format'
import type { ProductType, Plate, Accessory, Consumable, ImpositionResult, ScreenState, Quote, CalculatorMode, AmalgameGroup } from '@/types/calculator'
import { GROUP_COLORS, DEFAULT_PRODUCT_SLOT } from '@/types/calculator'
import type { PackagingRulesData } from '@/app/actions/reference-data'
import { createAccessory } from '@/app/actions/accessories'
import { v4 as uuidv4 } from 'uuid'
import { evalFormula, resolveFlatFormula } from '@/lib/utils'
import { resolveVerso } from './calculator/utils'
import { parseQuoteForLoad } from './calculator/quoteLoader'
import { useProductionState } from './calculator/useProductionState'
import { useImpositionResults } from './calculator/useImpositionResults'
import { useSaveHandlers } from './calculator/useSaveHandlers'
import type { TransportDeliveryForm } from '@/types/calculator'

export function useCalculator(
  initialProductTypes: ProductType[],
  plates: Plate[],
  accessories: Accessory[],
  consumables: Consumable[],
  initialQuote?: Quote,
  isViewOnly?: boolean,
  settings?: Record<string, number>,
  packagingRules?: PackagingRulesData,
  mode: CalculatorMode = 'quote',
  targetQuoteId?: number,
  productionSheetExtra?: {
    status?: string
    remarques?: string | null
    planImageUrl?: string | null
    nbCollages?: number | null
    collagePerPLV?: number | null
    faconnageNotes?: string | null
    conditionnementType?: string | null
    conditionnementNotes?: string | null
    achatsNotes?: string | null
  } | null
) {
  const [screenState, setScreenState] = useState<ScreenState>('form')
  const [productTypes, setProductTypes] = useState(initialProductTypes)
  const [impositionResult, setImpositionResult] = useState<ImpositionResult | null>(null)
  const [orientationOverride, setOrientationOverride] = useState<'normal' | 'rotated' | null>(null)
  const [amalgameGroups, setAmalgameGroups] = useState<AmalgameGroup[]>([])
  const [templateOptionSelections, setTemplateOptionSelections] = useState<{
    variantId: number
    label: string
    priceHT: number
    quantity: number
    optionName: string
    inputType: string
  }[]>([])
  const quoteLoaded = useRef(false)

  const prodState = useProductionState(productionSheetExtra)

  const {
    formState, setField, loadQuote, resetForm,
    addProduct, removeProduct, setActiveProduct, updateProduct,
    addTransportDelivery, removeTransportDelivery, updateTransportDelivery, bulkAddTransportDeliveries,
  } = useCalculatorForm()

  const {
    studyNumber, selectedProductTypeId, productSearch, isProductDropdownOpen,
    quantity, selectedPlateId, flatWidth, flatHeight, inkMlPerPlate, inkMlVerso,
    varnishSurfacePercent, flatColorSurfacePercent, printMode, isRectoVerso, hasVarnish,
    hasFlatColor, rectoVersoType, cuttingTimePerPoseSeconds, assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds, hasAssemblyNotice, currentAccessoryId, currentAccessoryQty,
    currentConsumableId, currentConsumableSize, hasPackaging, packagingBoxType,
    packagingMaterialType, packagingExternalSize, packagingProductLength, packagingProductWidth,
    packagingProductHeight, packagingProductThickness, packagingPlateId, packagingQuantity,
    packagingCuttingTimePerPoseSeconds, printSetupType, cuttingSetupType, hasImpression,
    hasFaconnage, hasConditionnement, hasAccessoires, hasBE, beTimeMinutes, batTimeMinutes,
    isMultiProduct, products, activeProductIndex, hasDossierFee, showMargeCommerciale, showMargeSopano,
    machineTimeMinOverride, plvQuantity, packagingUnitPriceOverride, bordABord, itemsPerPlateOverride,
  } = formState

  const {
    selectedAccessories, setSelectedAccessories,
    handleAddAccessory, handleRemoveAccessory, resetAccessories,
  } = useAccessories(
    accessories, currentAccessoryId, currentAccessoryQty,
    (v) => setField('currentAccessoryId', v),
    (v) => setField('currentAccessoryQty', v),
  )

  const {
    selectedConsumables, setSelectedConsumables,
    handleAddConsumable, handleRemoveConsumable, resetConsumables,
  } = useConsumables(
    consumables, quantity, currentConsumableId, currentConsumableSize,
    (v) => setField('currentConsumableId', v),
    (v) => setField('currentConsumableSize', v),
  )

  // ── Load initial quote ──
  useEffect(() => {
    if (!initialQuote || quoteLoaded.current) return
    quoteLoaded.current = true

    const { formPayload, accessories: accs, consumables: cons, amalgameGroups: groups } = parseQuoteForLoad(initialQuote)
    loadQuote(formPayload)

    if (accs.length > 0) setSelectedAccessories(accs)
    if (cons.length > 0) setSelectedConsumables(cons)
    if (groups.length > 0) setTimeout(() => setAmalgameGroups(groups), 0)
    if (isViewOnly) setScreenState('recap')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuote])

  // ── Resolved plate ──
  const selectedPlateBase = plates.find((p) => p.id.toString() === selectedPlateId)
  const plateCostOverride = formState.plateCostOverride
  const customPlate = formState.customPlate
  const selectedPlate = useMemo(() => {
    if (customPlate) {
      return { id: -1, name: customPlate.name, width: customPlate.width, height: customPlate.height, cost: customPlate.cost, material: customPlate.name }
    }
    if (!selectedPlateBase) return undefined
    return plateCostOverride !== null && plateCostOverride > 0
      ? { ...selectedPlateBase, cost: plateCostOverride }
      : selectedPlateBase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customPlate?.name, customPlate?.width, customPlate?.height, customPlate?.cost, selectedPlateBase, plateCostOverride])

  const selectedProductType = productTypes.find((pt) => pt.id.toString() === selectedProductTypeId)
  const packagingPlate = plates.find((p) => p.id.toString() === packagingPlateId)

  // ── Packaging dimensions ──
  const largestProduct = isMultiProduct && products.length > 0
    ? products.reduce((max, p) =>
        p.flatWidth * p.flatHeight > max.flatWidth * max.flatHeight ? p : max,
        products[0]
      )
    : null

  const effectivePackagingProductLength = isMultiProduct && largestProduct ? largestProduct.flatHeight : packagingProductLength
  const effectivePackagingProductWidth  = isMultiProduct && largestProduct ? largestProduct.flatWidth  : packagingProductWidth

  const computedPackagingDimensions = (() => {
    const L = effectivePackagingProductLength
    const W = effectivePackagingProductWidth
    const H = packagingProductHeight
    const T = packagingProductThickness
    if (L <= 0 || W <= 0) return { width: 0, height: 0 }
    switch (packagingBoxType) {
      case 'etui':        return { width: 2 * W + 2 * T, height: L + 2 * T + 100 }
      case 'caisse':      if (H <= 0) return { width: 0, height: 0 }; return { width: H + W, height: 2 * L + 2 * W + 50 }
      case 'plaque_rainee': return { width: W, height: 2 * L }
      default:            return { width: 0, height: 0 }
    }
  })()

  const poseSpacingMm = settings?.POSE_SPACING_MM ?? POSE_SPACING_MM
  const plateBorderMm = settings?.PLATE_BORDER_MM ?? PLATE_BORDER_MM
  const effectiveSpacing = bordABord ? 0 : poseSpacingMm

  // ── Single-product imposition ──
  useEffect(() => {
    if (isMultiProduct) return
    if (selectedPlate && flatWidth > 0 && flatHeight > 0 && quantity > 0) {
      const imp = calculateImposition(
        { width: flatWidth, height: flatHeight },
        { width: selectedPlate.width, height: selectedPlate.height },
        effectiveSpacing, orientationOverride ?? undefined, plateBorderMm
      )
      const effectiveCpp = (itemsPerPlateOverride && itemsPerPlateOverride > 0) ? itemsPerPlateOverride : imp.itemsPerPlate
      const platesNeeded = effectiveCpp > 0 ? Math.ceil(quantity / effectiveCpp) : 0
      setImpositionResult({
        itemsPerPlate: effectiveCpp,
        platesNeeded,
        materialCost: platesNeeded * selectedPlate.cost,
        orientation: imp.orientation,
        layout: imp.layout,
      })
    } else {
      setImpositionResult(null)
    }
  }, [flatWidth, flatHeight, quantity, selectedPlate, effectiveSpacing, isMultiProduct, orientationOverride, itemsPerPlateOverride])

  // ── Memoized multi-product calculations ──
  const { amalgameGroupResults, productSlotResults } = useImpositionResults({
    isMultiProduct, amalgameGroups, products, plates, settings, poseSpacingMm: effectiveSpacing, plateBorderMm,
  })

  const totalQuantityMulti = isMultiProduct ? products.reduce((sum, p) => sum + p.quantity, 0) : 0
  // Pour façonnage/conditionnement/transport en multi : utilise plvQuantity si défini, sinon somme des éléments
  const quantiteForFaconnage = isMultiProduct ? (plvQuantity ?? totalQuantityMulti) : quantity

  const fuelSurchargePct = settings?.GEODIS_FUEL_SURCHARGE_PERCENT ?? GEODIS_FUEL_SURCHARGE_PERCENT
  const transportTotal = formState.transportDeliveries.reduce((sum, d) => {
    if (!d.mode || !d.department || d.units === undefined) return sum
    if (d.mode !== 'AFFRETEMENT' && d.weightKg === undefined) return sum
    const calc = calculateTransport(d.mode as TransportMode, d.department, d.weightKg || 0, d.units, fuelSurchargePct, d.optionsHT || 0)
    return sum + (calc?.total ?? 0)
  }, 0)

  const { effectiveInkMl: effectiveInkMlPerPlate, effectiveIsRectoVerso } =
    resolveVerso(isRectoVerso, rectoVersoType, inkMlPerPlate, inkMlVerso)

  const settingsWithPackagingPrice = (() => {
    const isExternal = packagingMaterialType === 'B' || packagingMaterialType === 'EB'
    if (!isExternal || !packagingExternalSize || packagingQuantity <= 0) return settings
    if (!packagingRules?.rules?.length) return settings
    const category = (packagingBoxType || 'etui').toUpperCase()
    const mat = packagingMaterialType.toUpperCase()
    const sz = packagingExternalSize.toUpperCase()
    const rule = packagingRules.rules.find((r) => r.category === category && r.material === mat && r.size === sz)
    if (!rule) return settings
    let price = rule.baseUnitPrice
    if (packagingRules.coefficients?.length) {
      const band = packagingRules.coefficients.find(
        (c) => packagingQuantity >= c.minQuantity && (c.maxQuantity === null || packagingQuantity <= c.maxQuantity)
      )
      if (band) price = Math.round(price * band.coefficient * 10000) / 10000
    }
    return { ...settings, [`PACKAGING_${mat}_${sz}_PRICE`]: price }
  })()

  const costResult = calculateCosts({
    quantity: isMultiProduct ? quantiteForFaconnage : quantity,
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
    hasFaconnage, hasConditionnement, hasAccessoires,
    cuttingTimePerPoseSeconds: isMultiProduct ? 0 : cuttingTimePerPoseSeconds,
    machineTimeMinOverride: isMultiProduct ? null : (machineTimeMinOverride ?? null),
    assemblyTimePerPieceSeconds, packTimePerPieceSeconds, hasAssemblyNotice,
    selectedAccessories, selectedConsumables,
    settings: settingsWithPackagingPrice,
    hasPackaging, packagingMaterialType, packagingExternalSize,
    hasBE, beTimeMinutes, batTimeMinutes, hasDossierFee,
    packagingPlate, packagingQuantity, packagingCuttingTimePerPoseSeconds,
    packagingWidth: computedPackagingDimensions.width,
    packagingHeight: computedPackagingDimensions.height,
    packagingUnitPriceOverride: packagingUnitPriceOverride ?? null,
    transportTotal: transportTotal > 0 ? transportTotal : undefined,
  })

  const templateOptionsCost = templateOptionSelections.reduce((sum, s) => sum + s.priceHT * s.quantity, 0)

  const multiProductsSubtotal = productSlotResults.reduce((sum, r) => sum + r.costResult.subtotal, 0)
  const amalgameGroupsSubtotal = amalgameGroupResults.reduce((sum, r) => sum + r.totalCost, 0)
  const totalCostMulti = multiProductsSubtotal + amalgameGroupsSubtotal + costResult.totalCost

  const displayTotalForMarges = isMultiProduct ? totalCostMulti : costResult.totalCost + templateOptionsCost
  const margeCommercialeMontant = showMargeCommerciale ? displayTotalForMarges * (MARGE_COMMERCIALE_PERCENT / 100) : 0
  const margeSopanoMontant = showMargeSopano ? displayTotalForMarges * (MARGE_SOPANO_PERCENT / 100) : 0
  const totalNet = displayTotalForMarges - margeCommercialeMontant - margeSopanoMontant

  // ── Formatting callbacks ──
  const getCuttingDetails = useCallback(() => formatCuttingDetails({
    cuttingMachineTimeMin: costResult.cuttingMachineTimeMin,
    cuttingSetupTimeMin: costResult.cuttingSetupTimeMin,
    cuttingSetupType, cuttingTimePerPoseSeconds,
  }), [costResult.cuttingMachineTimeMin, costResult.cuttingSetupTimeMin, cuttingSetupType, cuttingTimePerPoseSeconds])

  const getAssemblyDetails = useCallback(() => formatAssemblyDetails({
    assemblyTimePerPieceSeconds,
    quantity: isMultiProduct ? quantiteForFaconnage : quantity,
  }), [assemblyTimePerPieceSeconds, quantity, isMultiProduct, totalQuantityMulti])

  const getPackDetails = useCallback(() => formatPackDetails({
    packTimePerPieceSeconds,
    quantity: isMultiProduct ? quantiteForFaconnage : quantity,
    hasAssemblyNotice,
    assemblyNoticeCostPerPiece: costResult.assemblyNoticeCostPerPiece,
  }), [packTimePerPieceSeconds, quantity, isMultiProduct, totalQuantityMulti, hasAssemblyNotice, costResult.assemblyNoticeCostPerPiece])

  // ── Save handlers ──
  const { isServing, handleSave, handleSaveProd, handleSaveActuals } = useSaveHandlers({
    studyNumber, client: formState.client, contactName: formState.contactName,
    selectedProductTypeId, quantity, selectedPlateId, customPlate, plateCostOverride,
    flatWidth, flatHeight, inkMlPerPlate, inkMlVerso,
    varnishSurfacePercent, flatColorSurfacePercent, printMode,
    isRectoVerso, rectoVersoType, hasVarnish, hasFlatColor,
    cuttingTimePerPoseSeconds, machineTimeMinOverride, bordABord, itemsPerPlateOverride, plvQuantity, assemblyTimePerPieceSeconds, packTimePerPieceSeconds,
    hasAssemblyNotice, hasPackaging, packagingBoxType, packagingMaterialType,
    packagingExternalSize, packagingProductLength, packagingProductWidth,
    packagingProductHeight, packagingProductThickness, packagingPlateId,
    packagingQuantity, packagingCuttingTimePerPoseSeconds, packagingUnitPriceOverride: packagingUnitPriceOverride ?? null,
    printSetupType, cuttingSetupType, hasImpression, hasFaconnage,
    hasConditionnement, hasAccessoires, hasBE, beTimeMinutes, batTimeMinutes,
    hasDossierFee, isMultiProduct, products, showMargeCommerciale, showMargeSopano,
    transportDeliveries: formState.transportDeliveries,
    impositionResult, productSlotResults, amalgameGroupResults, amalgameGroups,
    costResult, totalCostMulti, totalQuantityMulti, transportTotal, fuelSurchargePct,
    computedPackagingDimensions, selectedProductType, selectedAccessories, selectedConsumables,
    initialQuoteReference: initialQuote?.reference,
    targetQuoteId, ...prodState,
    setScreenState,
  })

  // ── Template / create helpers ──
  const applyTemplate = useCallback((template: ProductType['templates'][number]) => {
    const resolveTemplateFlatDimensions = (
      width: number | null | undefined,
      depth: number | null | undefined,
      height: number | null | undefined
    ) => {
      // An element with a depth value is always 3D regardless of the parent template's formatType
      const effectiveFormatType = (depth != null && depth > 0) ? '3d' : template.formatType
      if (effectiveFormatType !== '3d') {
        return { width: width ?? null, height: height ?? null }
      }
      if (!width || !depth || !height) {
        return { width: width ?? null, height: height ?? null }
      }
      const widthFormula = resolveFlatFormula(selectedProductType?.flatWidthFormula, 'width', '3d')
      const heightFormula = resolveFlatFormula(selectedProductType?.flatHeightFormula, 'height', '3d')
      return {
        width: evalFormula(widthFormula, width, depth, height) ?? width,
        height: evalFormula(heightFormula, width, depth, height) ?? height,
      }
    }

    const templateDims = resolveTemplateFlatDimensions(template.flatWidth, template.flatDepth, template.flatHeight)
    if (templateDims.width) setField('flatWidth', templateDims.width)
    if (templateDims.height) setField('flatHeight', templateDims.height)
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
    if (template.accessories.length > 0) {
      setSelectedAccessories(template.accessories.map((a) => ({
        id: a.accessory.id, name: a.accessory.name, price: a.accessory.price, quantity: a.quantity,
      })))
    }
    if (template.amalgameGroupsJson) {
      try {
        const groups = JSON.parse(template.amalgameGroupsJson)
        setAmalgameGroups(Array.isArray(groups) ? groups : [])
      } catch {
        setAmalgameGroups([])
      }
    } else if (template.hasAmalgame && template.amalgameRuns.length > 0) {
      setAmalgameGroups(template.amalgameRuns.map((r, i) => ({
        id: uuidv4(), name: r.name, colorIndex: i % GROUP_COLORS.length,
        amalgameType: r.hasImpression ? 'impression_decoupe' as const : 'decoupe' as const,
        plateId: r.plateId?.toString() ?? '', cuttingSetupType: 'none' as const,
        cuttingTimePerPoseSeconds: 0, printMode: 'production' as const,
        isRectoVerso: false, rectoVersoType: null, inkMlPerPlate: 20, inkMlVerso: 0,
        hasVarnish: false, hasFlatColor: false, varnishSurfacePercent: 0,
        flatColorSurfacePercent: 0, printSetupType: 'none' as const,
        machineTimeMinOverride: null,
      })))
    } else {
      setAmalgameGroups([])
    }
    const variantSelections = (template.templateVariants ?? []).map((tv) => ({
      variantId: tv.variantId,
      label: tv.variant.label,
      priceHT: tv.variant.priceHT ?? 0,
      quantity: tv.defaultQuantity,
      optionName: tv.variant.option.name,
      inputType: tv.variant.option.inputType,
    }))
    const optionSelections = (template.templateOptionConfigs ?? []).map((oc) => ({
      variantId: -(oc.optionId), // negative to distinguish from real variantIds
      label: oc.option.name,
      priceHT: oc.option.priceHT ?? 0,
      quantity: oc.defaultQuantity,
      optionName: oc.option.name,
      inputType: oc.option.inputType,
    }))
    setTemplateOptionSelections([...variantSelections, ...optionSelections])
    if (template.templateElements && template.templateElements.length >= 2) {
      setField('isMultiProduct', true)
      setField('products', template.templateElements.map((te) => ({
        ...DEFAULT_PRODUCT_SLOT,
        id: uuidv4(),
        productSearch: te.element.name,
        flatWidth: resolveTemplateFlatDimensions(te.flatWidth, te.flatDepth, te.flatHeight).width ?? 0,
        flatHeight: resolveTemplateFlatDimensions(te.flatWidth, te.flatDepth, te.flatHeight).height ?? 0,
        selectedPlateId: te.plateId?.toString() ?? '',
        quantity: 100,
        hasImpression: te.hasImpression,
        printMode: te.printMode as 'production' | 'quality',
        printSetupType: te.printSetupType as 'none' | 'standard' | 'complexe',
        isRectoVerso: te.isRectoVerso,
        rectoVersoType: te.rectoVersoType as 'identical' | 'different' | null,
        hasVarnish: te.hasVarnish,
        hasFlatColor: te.hasFlatColor,
        inkMlPerPlate: te.inkMlPerPlate,
        inkMlVerso: te.inkMlVerso,
        varnishSurfacePercent: te.varnishSurfacePercent,
        flatColorSurfacePercent: te.flatColorSurfacePercent,
        cuttingTimePerPoseSeconds: te.cuttingTimePerPoseSeconds,
        cuttingSetupType: te.cuttingSetupType as 'none' | 'standard' | 'complexe',
        amalgameGroupId: te.amalgameGroupId ?? null,
      })))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setField, selectedProductType])

  const handleCreateProductType = async () => {
    if (!productSearch) return
    try {
      const newType = await createProductType(productSearch)
      if (!productTypes.find((pt) => pt.id === newType.id)) {
        setProductTypes([...productTypes, { ...newType, flatWidthFormula: 'l', flatHeightFormula: 'L', elements: [], templates: [] }])
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
        setProductTypes([...productTypes, { ...newType, flatWidthFormula: 'l', flatHeightFormula: 'L', elements: [], templates: [] }])
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
    bordABord, setBordABord: (v: boolean) => setField('bordABord', v),
    itemsPerPlateOverride, setItemsPerPlateOverride: (v: number | null) => setField('itemsPerPlateOverride', v),
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
    machineTimeMinOverride, setMachineTimeMinOverride: (v: number | null) => setField('machineTimeMinOverride', v),
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
    computedPackagingDimensions, largestProduct,
    hasBE, setHasBE: (v: boolean) => setField('hasBE', v),
    beTimeMinutes, setBeTimeMinutes: (v: number) => setField('beTimeMinutes', v),
    batTimeMinutes, setBatTimeMinutes: (v: number) => setField('batTimeMinutes', v),
    packagingPlateId, setPackagingPlateId: (v: string) => setField('packagingPlateId', v),
    packagingQuantity, setPackagingQuantity: (v: number) => setField('packagingQuantity', v),
    packagingCuttingTimePerPoseSeconds, setPackagingCuttingTimePerPoseSeconds: (v: number) => setField('packagingCuttingTimePerPoseSeconds', v),
    hasDossierFee, setHasDossierFee: (v: boolean) => setField('hasDossierFee', v),
    handleAddAccessory, handleRemoveAccessory,
    handleAddConsumable, handleRemoveConsumable,
    handleCreateProductType, handleCreateProductTypeForSlot, handleCreateAccessory,
    handleSave, handleReset, applyTemplate,
    getCuttingDetails, getAssemblyDetails, getPackDetails,
    formState, costResult,
    isMultiProduct, setIsMultiProduct: (v: boolean) => setField('isMultiProduct', v),
    plvQuantity, setPlvQuantity: (v: number | null) => setField('plvQuantity', v),
    packagingUnitPriceOverride, setPackagingUnitPriceOverride: (v: number | null) => setField('packagingUnitPriceOverride', v),
    products, activeProductIndex, productSlotResults,
    totalQuantityMulti, totalCostMulti,
    addProduct, removeProduct, setActiveProduct, updateProduct,
    addTransportDelivery, removeTransportDelivery, updateTransportDelivery, bulkAddTransportDeliveries,
    showMargeCommerciale, setShowMargeCommerciale: (v: boolean) => setField('showMargeCommerciale', v),
    showMargeSopano, setShowMargeSopano: (v: boolean) => setField('showMargeSopano', v),
    margeCommercialeMontant, margeSopanoMontant, totalNet,
    settings, setField,
    customPlate, setCustomPlate: (v: { name: string; width: number; height: number; cost: number } | null) => setField('customPlate', v),
    mode, targetQuoteId,
    ...prodState,
    handleSaveProd, handleSaveActuals,
    amalgameGroups, setAmalgameGroups,
    amalgameGroupResults,
    templateOptionSelections, setTemplateOptionSelections, templateOptionsCost,
  }
}
