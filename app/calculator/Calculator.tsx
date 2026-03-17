'use client'

import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Calculator as CalcIcon,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import type { CalculatorProps } from '@/types/calculator'
import { useCalculator, formatTimeSeconds } from '@/hooks/useCalculator'
import { GaugeSlider } from '../components/GaugeSlider'
import { SectionDisplay } from './shared'
import { ScreenSuccess } from './screens/ScreenSuccess'
import { ScreenRecap } from './screens/ScreenRecap'
import { SectionPresentation } from './sections/SectionPresentation'
import { SectionImpression } from './sections/SectionImpression'
import { SectionAccessoires } from './sections/SectionAccessoires'
import { SectionFaconnage } from './sections/SectionFaconnage'
import { SectionConditionnement } from './sections/SectionConditionnement'
import { SectionEmballage } from './sections/SectionEmballage' // ✅
import { RecapSidebar } from './sections/RecapSidebar'

export default function Calculator({
  productTypes: initialProductTypes,
  plates,
  accessories = [],
  consumables = [],
  isAdmin = false,
  initialQuote,
  isViewOnly,
  settings,
}: CalculatorProps) {
  const calc = useCalculator(
    initialProductTypes,
    plates,
    accessories,
    consumables,
    initialQuote,
    isViewOnly,
    settings
  )

  const {
    screenState,
    setScreenState,
    isServing,
    studyNumber,
    setStudyNumber,
    productTypes,
    productSearch,
    setProductSearch,
    isProductDropdownOpen,
    setIsProductDropdownOpen,
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
    impositionResult,
    printSurfacePercent,
    setPrintSurfacePercent,
    printMode,
    setPrintMode,
    isRectoVerso,
    setIsRectoVerso,
    rectoVersoType,
    setRectoVersoType,
    hasVarnish,
    setHasVarnish,
    hasFlatColor,
    setHasFlatColor,
    printingCostData,
    inkVolumeL,
    cuttingTimePerPoseSeconds,
    setCuttingTimePerPoseSeconds,
    cuttingCost,
    assemblyTimePerPieceSeconds,
    setAssemblyTimePerPieceSeconds,
    assemblyCost,
    packTimePerPieceSeconds,
    setPackTimePerPieceSeconds,
    hasAssemblyNotice,
    setHasAssemblyNotice,
    packagingCost,
    selectedAccessories,
    currentAccessoryId,
    setCurrentAccessoryId,
    currentAccessoryQty,
    setCurrentAccessoryQty,
    accessoriesCost,
    totalCost,
    selectedConsumables,
    currentConsumableId,
    setCurrentConsumableId,
    currentConsumableSize,
    setCurrentConsumableSize,
    consumablesCost,
    handleAddConsumable,
    handleRemoveConsumable,
    handleAddAccessory,
    handleRemoveAccessory,
    handleCreateProductType,
    handleSave,
    getCuttingDetails,
    getAssemblyDetails,
    getPackDetails,
    // ✅ Emballage
    hasPackaging,
    setHasPackaging,
    packagingPlateId,
    setPackagingPlateId,
    packagingQuantity,
    setPackagingQuantity,
    packagingCuttingTimePerPoseSeconds,
    setPackagingCuttingTimePerPoseSeconds,
    packagingMaterialCost,
    packagingCuttingCost,
    packagingTotalCost,
  } = calc

  if (screenState === 'success') {
    return <ScreenSuccess />
  }

  if (screenState === 'recap') {
    return (
      <ScreenRecap
        studyNumber={studyNumber}
        productSearch={productSearch}
        quantity={quantity}
        selectedPlate={selectedPlate}
        flatWidth={flatWidth}
        flatHeight={flatHeight}
        impositionResult={impositionResult || undefined}
        printSurfacePercent={printSurfacePercent}
        isRectoVerso={isRectoVerso}
        rectoVersoType={rectoVersoType}
        hasVarnish={hasVarnish}
        hasFlatColor={hasFlatColor}
        printMode={printMode}
        cuttingTimePerPoseSeconds={cuttingTimePerPoseSeconds}
        printingCostData={printingCostData}
        inkVolumeL={inkVolumeL}
        cuttingCost={cuttingCost}
        assemblyTimePerPieceSeconds={assemblyTimePerPieceSeconds}
        assemblyCost={assemblyCost}
        packTimePerPieceSeconds={packTimePerPieceSeconds}
        packagingCost={packagingCost}
        hasAssemblyNotice={hasAssemblyNotice}
        totalCost={totalCost}
        accessoriesCost={accessoriesCost}
        consumablesCost={consumablesCost}
        selectedAccessories={selectedAccessories}
        selectedConsumables={selectedConsumables}
        hasPackaging={hasPackaging}
        packagingTotalCost={packagingTotalCost}
        packagingMaterialCost={packagingMaterialCost}
        packagingCuttingCost={packagingCuttingCost}
        getCuttingDetails={getCuttingDetails}
        getAssemblyDetails={getAssemblyDetails}
        getPackDetails={getPackDetails}
        setScreenState={setScreenState}
      />
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-lg shadow-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalcIcon className="h-6 w-6 text-emerald-400" />
            Calculateur de ouf
          </h1>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button variant="outline" className="text-slate-900 border-white hover:bg-slate-200">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">

          {/* 1. Présentation */}
          <SectionPresentation
            studyNumber={studyNumber}
            setStudyNumber={setStudyNumber}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            isProductDropdownOpen={isProductDropdownOpen}
            setIsProductDropdownOpen={setIsProductDropdownOpen}
            productTypes={productTypes}
            setSelectedProductTypeId={setSelectedProductTypeId}
            handleCreateProductType={handleCreateProductType}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedPlateId={selectedPlateId}
            setSelectedPlateId={setSelectedPlateId}
            plates={plates}
            flatWidth={flatWidth}
            setFlatWidth={setFlatWidth}
            flatHeight={flatHeight}
            setFlatHeight={setFlatHeight}
          />

          {/* 2. Poses */}
          {impositionResult && (
            <SectionDisplay number="2" title="Poses (Imposition)" color="blue">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {impositionResult.itemsPerPlate}
                  </div>
                  <div className="text-xs text-blue-400 uppercase">Poses / Plaque</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{impositionResult.orientation}</div>
                  <div className="text-xs text-slate-400">Orientation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-700">
                    {impositionResult.platesNeeded}
                  </div>
                  <div className="text-xs text-slate-400 uppercase">Plaques Nécessaires</div>
                </div>
              </div>
            </SectionDisplay>
          )}

          {/* 3. Impression */}
          <SectionImpression
            printMode={printMode}
            setPrintMode={setPrintMode}
            isRectoVerso={isRectoVerso}
            setIsRectoVerso={setIsRectoVerso}
            rectoVersoType={rectoVersoType}
            setRectoVersoType={setRectoVersoType}
            hasVarnish={hasVarnish}
            setHasVarnish={setHasVarnish}
            hasFlatColor={hasFlatColor}
            setHasFlatColor={setHasFlatColor}
            printSurfacePercent={printSurfacePercent}
            setPrintSurfacePercent={setPrintSurfacePercent}
            printingCostData={printingCostData}
            impositionResult={impositionResult || undefined}
            selectedPlate={selectedPlate}
          />

          {/* 4. Découpe */}
          <SectionDisplay number="4" title="Découpe" color="orange">
            <GaugeSlider
              label="Temps par Pose"
              value={cuttingTimePerPoseSeconds}
              min={20}
              max={300}
              unit="sec"
              onChange={setCuttingTimePerPoseSeconds}
              formatValue={formatTimeSeconds}
              gradientColors="from-yellow-300 to-orange-600"
            />
          </SectionDisplay>

          {/* 5. Façonnage */}
          <SectionFaconnage
            assemblyTimePerPieceSeconds={assemblyTimePerPieceSeconds}
            setAssemblyTimePerPieceSeconds={setAssemblyTimePerPieceSeconds}
            selectedConsumables={selectedConsumables}
            consumablesCost={consumablesCost}
            consumables={consumables}
            currentConsumableId={currentConsumableId}
            setCurrentConsumableId={setCurrentConsumableId}
            currentConsumableSize={currentConsumableSize}
            setCurrentConsumableSize={setCurrentConsumableSize}
            handleAddConsumable={handleAddConsumable}
            handleRemoveConsumable={handleRemoveConsumable}
          />

          {/* 6. Conditionnement */}
          <SectionConditionnement
            packTimePerPieceSeconds={packTimePerPieceSeconds}
            setPackTimePerPieceSeconds={setPackTimePerPieceSeconds}
            hasAssemblyNotice={hasAssemblyNotice}
            setHasAssemblyNotice={setHasAssemblyNotice}
          />

          {/* 7. Accessoires */}
          <SectionAccessoires
            currentAccessoryId={currentAccessoryId}
            setCurrentAccessoryId={setCurrentAccessoryId}
            accessories={accessories}
            currentAccessoryQty={currentAccessoryQty}
            setCurrentAccessoryQty={setCurrentAccessoryQty}
            handleAddAccessory={handleAddAccessory}
            selectedAccessories={selectedAccessories}
            handleRemoveAccessory={handleRemoveAccessory}
            accessoriesCost={accessoriesCost}
          />

          {/* 8. Emballage ✅ */}
          <SectionEmballage
            hasPackaging={hasPackaging}
            setHasPackaging={setHasPackaging}
            packagingPlateId={packagingPlateId}
            setPackagingPlateId={setPackagingPlateId}
            packagingQuantity={packagingQuantity}
            setPackagingQuantity={setPackagingQuantity}
            packagingCuttingTimePerPoseSeconds={packagingCuttingTimePerPoseSeconds}
            setPackagingCuttingTimePerPoseSeconds={setPackagingCuttingTimePerPoseSeconds}
            plates={plates}
            packagingMaterialCost={packagingMaterialCost}
            packagingCuttingCost={packagingCuttingCost}
            packagingTotalCost={packagingTotalCost}
          />
        </div>

        {/* Sidebar */}
        <RecapSidebar
          impositionResult={impositionResult || undefined}
          selectedPlate={selectedPlate}
          printingCostData={printingCostData}
          inkVolumeL={inkVolumeL}
          cuttingCost={cuttingCost}
          getCuttingDetails={getCuttingDetails}
          assemblyCost={assemblyCost}
          getAssemblyDetails={getAssemblyDetails}
          packagingCost={packagingCost}
          getPackDetails={getPackDetails}
          accessoriesCost={accessoriesCost}
          selectedAccessories={selectedAccessories}
          consumablesCost={consumablesCost}
          selectedConsumables={selectedConsumables}
          hasPackaging={hasPackaging}
          packagingTotalCost={packagingTotalCost}
          totalCost={totalCost}
          quantity={quantity}
          handleSave={handleSave}
          isServing={isServing}
        />
      </div>
    </div>
  )
}
