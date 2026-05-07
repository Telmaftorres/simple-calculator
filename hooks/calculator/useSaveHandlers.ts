'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote } from '@/app/actions/quotes'
import { saveProductionSheetFull } from '@/app/actions/production-sheet'
import { saveActualsFromCalc } from '@/app/actions/actuals'
import { toast } from 'sonner'
import { calculateTransport, type TransportMode } from '@/lib/transport/geodis-rates'
import type {
  ImpositionResult, AmalgameGroup, AmalgameGroupResult, ProductSlot,
  ProductSlotResult, ProductType, SelectedAccessory, SelectedConsumable,
  ScreenState, TransportDeliveryForm,
} from '@/types/calculator'
import type { calculateCosts } from '@/lib/calculation/costs'

export interface SaveContext {
  // Form state fields
  studyNumber: string
  client: string | null
  contactName: string | null
  selectedProductTypeId: string
  quantity: number
  selectedPlateId: string
  customPlate: { name: string; width: number; height: number; cost: number } | null
  plateCostOverride: number | null
  flatWidth: number
  flatHeight: number
  inkMlPerPlate: number
  inkMlVerso: number
  varnishSurfacePercent: number
  flatColorSurfacePercent: number
  printMode: 'production' | 'quality'
  isRectoVerso: boolean
  rectoVersoType: 'identical' | 'different' | null
  hasVarnish: boolean
  hasFlatColor: boolean
  cuttingTimePerPoseSeconds: number
  machineTimeMinOverride: number | null
  assemblyTimePerPieceSeconds: number
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  hasPackaging: boolean
  packagingBoxType: 'etui' | 'caisse' | 'plaque_rainee'
  packagingMaterialType: 'B' | 'EB' | 'C' | 'BC'
  packagingExternalSize: 'petit' | 'moyen' | 'grand' | null
  packagingProductLength: number
  packagingProductWidth: number
  packagingProductHeight: number
  packagingProductThickness: number
  packagingPlateId: string
  packagingQuantity: number
  packagingCuttingTimePerPoseSeconds: number
  packagingUnitPriceOverride: number | null
  printSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  hasImpression: boolean
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasAccessoires: boolean
  hasBE: boolean
  beTimeMinutes: number
  batTimeMinutes: number
  hasDossierFee: boolean
  isMultiProduct: boolean
  plvQuantity: number | null
  products: ProductSlot[]
  showMargeCommerciale: boolean
  showMargeSopano: boolean
  transportDeliveries: TransportDeliveryForm[]
  // Computed values
  impositionResult: ImpositionResult | null
  productSlotResults: ProductSlotResult[]
  amalgameGroupResults: AmalgameGroupResult[]
  amalgameGroups: AmalgameGroup[]
  costResult: ReturnType<typeof calculateCosts>
  totalCostMulti: number
  totalQuantityMulti: number
  transportTotal: number
  fuelSurchargePct: number
  computedPackagingDimensions: { width: number; height: number }
  selectedProductType: ProductType | undefined
  selectedAccessories: SelectedAccessory[]
  selectedConsumables: SelectedConsumable[]
  initialQuoteReference?: string | null
  // Production/actuals mode
  targetQuoteId?: number
  prodStatus: 'en_attente' | 'en_cours' | 'termine'
  prodRemarques: string | null
  prodPlanImageUrl: string | null
  prodNbCollages: number | null
  prodCollagePerPLV: number | null
  prodFaconnageNotes: string | null
  prodConditionnementType: string | null
  prodConditionnementNotes: string | null
  prodAchatsNotes: string | null
  actualsNotes: string | null
  setScreenState: (v: ScreenState) => void
}

export function useSaveHandlers(ctx: SaveContext) {
  const router = useRouter()
  const [isServing, setIsServing] = useState(false)

  const handleSave = async () => {
    const {
      isMultiProduct, products, impositionResult, amalgameGroups, amalgameGroupResults,
      productSlotResults, costResult, totalCostMulti, totalQuantityMulti, transportTotal,
      fuelSurchargePct, computedPackagingDimensions, selectedProductType, selectedAccessories,
      selectedConsumables, customPlate, setScreenState, transportDeliveries,
    } = ctx

    if (isMultiProduct) {
      if (products.length === 0) {
        toast.error('Ajoutez au moins un produit.')
        return
      }
      const incomplete = products.find((p) => {
        const group = p.amalgameGroupId ? amalgameGroups.find((g) => g.id === p.amalgameGroupId) : undefined
        const needsPlate = group?.amalgameType !== 'impression_decoupe'
        return !p.productTypeId || (needsPlate && !p.selectedPlateId) || p.flatWidth <= 0 || p.flatHeight <= 0 || p.quantity <= 0
      })
      if (incomplete) {
        toast.error('Tous les produits doivent être complétés.')
        return
      }
    } else {
      const parsedProductId = parseInt(ctx.selectedProductTypeId)
      const hasPlate = !!ctx.selectedPlateId || !!customPlate
      if (!impositionResult || !hasPlate || !ctx.selectedProductTypeId || isNaN(parsedProductId)) {
        toast.error('Veuillez sélectionner un Type de PLV valide.')
        return
      }
    }

    setIsServing(true)
    try {
      const parsedProductId = isMultiProduct ? 0 : parseInt(ctx.selectedProductTypeId)

      await createQuote({
        studyNumber: ctx.studyNumber,
        client: ctx.client || undefined,
        contactName: ctx.contactName || undefined,
        productTypeId: isMultiProduct ? parseInt(products[0].productTypeId) : parsedProductId,
        quantity: isMultiProduct ? totalQuantityMulti : ctx.quantity,
        plateId: customPlate ? null : (isMultiProduct ? parseInt(products[0].selectedPlateId) : parseInt(ctx.selectedPlateId)),
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
        flatWidth: isMultiProduct ? products[0].flatWidth : ctx.flatWidth,
        flatHeight: isMultiProduct ? products[0].flatHeight : ctx.flatHeight,
        inkMlPerPlate: isMultiProduct ? 0 : ctx.inkMlPerPlate,
        inkMlVerso: isMultiProduct ? 0 : ctx.inkMlVerso,
        varnishSurfacePercent: isMultiProduct ? 0 : ctx.varnishSurfacePercent,
        flatColorSurfacePercent: isMultiProduct ? 0 : ctx.flatColorSurfacePercent,
        printMode: isMultiProduct ? 'production' : ctx.printMode,
        isRectoVerso: isMultiProduct ? false : ctx.isRectoVerso,
        rectoVersoType: isMultiProduct ? null : ctx.rectoVersoType,
        hasVarnish: isMultiProduct ? false : ctx.hasVarnish,
        hasFlatColor: isMultiProduct ? false : ctx.hasFlatColor,
        cuttingTimePerPoseSeconds: isMultiProduct ? 0 : ctx.cuttingTimePerPoseSeconds,
        machineTimeMinOverride: isMultiProduct ? null : (ctx.machineTimeMinOverride ?? null),
        assemblyTimePerPieceSeconds: ctx.assemblyTimePerPieceSeconds,
        packTimePerPieceSeconds: ctx.packTimePerPieceSeconds,
        hasAssemblyNotice: ctx.hasAssemblyNotice,
        hasPackaging: ctx.hasPackaging,
        packagingBoxType: ctx.packagingBoxType,
        packagingMaterialType: ctx.packagingMaterialType,
        packagingExternalSize: ctx.packagingExternalSize,
        packagingProductLength: ctx.packagingProductLength || null,
        packagingProductWidth: ctx.packagingProductWidth || null,
        packagingProductHeight: ctx.packagingProductHeight || null,
        packagingProductThickness: ctx.packagingProductThickness || null,
        packagingPlateId: ctx.packagingPlateId ? parseInt(ctx.packagingPlateId) : null,
        packagingQuantity: ctx.packagingQuantity || null,
        packagingCuttingTimePerPoseSeconds: ctx.packagingCuttingTimePerPoseSeconds,
        packagingUnitPriceOverride: ctx.packagingUnitPriceOverride ?? null,
        packagingWidth: computedPackagingDimensions.width || null,
        packagingHeight: computedPackagingDimensions.height || null,
        printSetupType: isMultiProduct ? 'none' : ctx.printSetupType,
        cuttingSetupType: isMultiProduct ? 'none' : ctx.cuttingSetupType,
        hasImpression: isMultiProduct ? false : ctx.hasImpression,
        hasFaconnage: ctx.hasFaconnage,
        hasConditionnement: ctx.hasConditionnement,
        hasAccessoires: ctx.hasAccessoires,
        hasBE: ctx.hasBE,
        beTimeMinutes: ctx.beTimeMinutes,
        batTimeMinutes: ctx.batTimeMinutes,
        hasDossierFee: ctx.hasDossierFee,
        plateCostOverride: ctx.plateCostOverride ?? null,
        isMultiProduct,
        plvQuantity: isMultiProduct ? (ctx.plvQuantity ?? null) : null,
        showMargeCommerciale: ctx.showMargeCommerciale,
        showMargeSopano: ctx.showMargeSopano,
        elements: isMultiProduct ? [] : (selectedProductType?.elements.map((el) => ({
          name: el.name,
          quantity: el.quantity,
        })) || []),
        accessories: selectedAccessories.map((sa) => ({ id: sa.id, quantity: sa.quantity })),
        consumables: selectedConsumables.map((sc) => ({ id: sc.id, sizePerItem: sc.sizePerItem })),
        transportTotal: transportTotal > 0 ? transportTotal : undefined,
        transportDeliveries: transportDeliveries
          .filter((d) => d.mode && d.department && d.units)
          .map((d) => {
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
        parentReference: ctx.initialQuoteReference || undefined,
        products: isMultiProduct ? products.map((p, i) => ({
          position: i,
          productTypeId: parseInt(p.productTypeId) || null,
          productTypeName: p.productSearch,
          flatWidth: p.flatWidth,
          flatHeight: p.flatHeight,
          quantity: p.quantity,
          plateId: (p.amalgameGroupId && amalgameGroups.find((g) => g.id === p.amalgameGroupId)?.amalgameType === 'impression_decoupe')
            ? null
            : (parseInt(p.selectedPlateId) || null),
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
          amalgameGroupIndex: p.amalgameGroupId ? amalgameGroups.findIndex((g) => g.id === p.amalgameGroupId) : null,
          countPerPlateInGroup: (p.countPerPlateInGroup > 0 ? p.countPerPlateInGroup : null),
        })) : [],
        hasAmalgame: isMultiProduct && amalgameGroups.length > 0,
        amalgameRuns: (isMultiProduct && amalgameGroups.length > 0) ? amalgameGroups.map((g, i) => ({
          name: g.name,
          plateId: g.plateId ? parseInt(g.plateId) : null,
          hasImpression: g.amalgameType === 'impression_decoupe',
          cuttingSetupType: g.cuttingSetupType,
          cuttingTimePerPoseSeconds: g.cuttingTimePerPoseSeconds,
          printMode: g.printMode,
          isRectoVerso: g.isRectoVerso,
          rectoVersoType: g.rectoVersoType,
          inkMlPerPlate: g.inkMlPerPlate,
          inkMlVerso: g.inkMlVerso,
          hasVarnish: g.hasVarnish,
          hasFlatColor: g.hasFlatColor,
          varnishSurfacePercent: g.varnishSurfacePercent,
          flatColorSurfacePercent: g.flatColorSurfacePercent,
          printSetupType: g.printSetupType,
          machineTimeMinOverride: g.machineTimeMinOverride ?? null,
          mainPerPlate: null,
          platesCount: amalgameGroupResults[i]?.platesCount ?? null,
          position: i,
          items: [],
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
      toast.error(knownMessages[rawMessage] || 'Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setIsServing(false)
    }
  }

  const handleSaveProd = async () => {
    if (!ctx.targetQuoteId) return
    setIsServing(true)
    try {
      const snapshot = {
        cuttingTimePerPoseSeconds: ctx.cuttingTimePerPoseSeconds,
        machineTimeMinOverride: ctx.machineTimeMinOverride ?? null,
        assemblyTimePerPieceSeconds: ctx.assemblyTimePerPieceSeconds,
        packTimePerPieceSeconds: ctx.packTimePerPieceSeconds,
        inkMlPerPlate: ctx.inkMlPerPlate,
        platesCount: ctx.impositionResult?.platesNeeded ?? null,
        transportTotal: ctx.costResult.transportTotal ?? null,
        printMode: ctx.printMode,
        isRectoVerso: ctx.isRectoVerso,
        hasVarnish: ctx.hasVarnish,
        hasFlatColor: ctx.hasFlatColor,
        hasImpression: ctx.hasImpression,
        hasFaconnage: ctx.hasFaconnage,
        hasConditionnement: ctx.hasConditionnement,
        printSetupType: ctx.printSetupType,
        cuttingSetupType: ctx.cuttingSetupType,
      }
      await saveProductionSheetFull(
        ctx.targetQuoteId,
        JSON.stringify(snapshot),
        {
          status: ctx.prodStatus,
          remarques: ctx.prodRemarques,
          planImageUrl: ctx.prodPlanImageUrl,
          nbCollages: ctx.prodNbCollages,
          collagePerPLV: ctx.prodCollagePerPLV,
          faconnageNotes: ctx.prodFaconnageNotes,
          conditionnementType: ctx.prodConditionnementType,
          conditionnementNotes: ctx.prodConditionnementNotes,
          achatsNotes: ctx.prodAchatsNotes,
        }
      )
      toast.success('Fiche de production sauvegardée !')
      router.push(`/dashboard/my-quotes/${ctx.targetQuoteId}?tab=production`)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsServing(false)
    }
  }

  const handleSaveActuals = async () => {
    if (!ctx.targetQuoteId) return
    setIsServing(true)
    try {
      await saveActualsFromCalc(ctx.targetQuoteId, {
        cuttingTimePerPoseSeconds: ctx.cuttingTimePerPoseSeconds,
        machineTimeMinOverride: ctx.machineTimeMinOverride ?? null,
        assemblyTimePerPieceSeconds: ctx.assemblyTimePerPieceSeconds,
        packTimePerPieceSeconds: ctx.packTimePerPieceSeconds,
        platesCount: ctx.impositionResult?.platesNeeded ?? null,
        transportTotal: ctx.costResult.transportTotal ?? null,
        transportMode: ctx.transportDeliveries?.[0]?.mode ?? null,
        notes: ctx.actualsNotes,
      })
      toast.success('Données réelles sauvegardées !')
      router.push(`/dashboard/my-quotes/${ctx.targetQuoteId}?tab=actuals`)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsServing(false)
    }
  }

  return { isServing, handleSave, handleSaveProd, handleSaveActuals }
}
