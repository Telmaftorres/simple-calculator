import type { Plate } from '@/types/calculator'
import { PRINT_SPEED_PRODUCTION, PRINT_SPEED_QUALITY } from '@/lib/config/pricing'

export interface AmalgameRunItem {
  name: string
  flatWidth: number
  flatHeight: number
  countPerPlate: number
  quantityPerUnit: number
}

export interface AmalgameRun {
  name: string
  plateId: number | null
  hasImpression: boolean
  mainPerPlate: number | null
  position: number
  items: AmalgameRunItem[]
}

export interface AmalgameRunCalcResult {
  name: string
  plate: Plate | null
  hasImpression: boolean
  platesCount: number
  materialCost: number
  machineTimeMin: number
}

export interface AmalgameCalcResult {
  runs: AmalgameRunCalcResult[]
  totalMaterialCost: number
  totalMachineTimeMin: number
  mainRunPlatesCount: number
}

export function calculateAmalgame(
  runs: AmalgameRun[],
  quantity: number,
  plates: Plate[],
  printMode: 'production' | 'quality',
  isRectoVerso: boolean,
  settings?: Record<string, number>,
): AmalgameCalcResult {
  const multiplier = isRectoVerso ? 2 : 1
  const pace = printMode === 'production'
    ? (settings?.PRINT_SPEED_PRODUCTION ?? PRINT_SPEED_PRODUCTION)
    : (settings?.PRINT_SPEED_QUALITY ?? PRINT_SPEED_QUALITY)

  let mainRunPlatesCount = 0

  const runCalcs: AmalgameRunCalcResult[] = runs
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((run) => {
      let platesCount: number
      if (run.mainPerPlate != null && run.mainPerPlate > 0) {
        platesCount = Math.ceil(quantity / run.mainPerPlate)
        mainRunPlatesCount = platesCount
      } else if (run.items.length > 0) {
        platesCount = Math.max(...run.items.map((item) =>
          Math.ceil((quantity * item.quantityPerUnit) / item.countPerPlate)
        ))
      } else {
        platesCount = 0
      }

      const plate = plates.find((p) => p.id === run.plateId) ?? null
      const materialCost = plate ? platesCount * plate.cost : 0

      let machineTimeMin = 0
      if (run.hasImpression && plate && platesCount > 0) {
        const plateAreaM2 = (plate.width * plate.height) / 1_000_000
        machineTimeMin = plateAreaM2 * pace * multiplier * platesCount
      }

      return { name: run.name, plate, hasImpression: run.hasImpression, platesCount, materialCost, machineTimeMin }
    })

  return {
    runs: runCalcs,
    totalMaterialCost: runCalcs.reduce((s, r) => s + r.materialCost, 0),
    totalMachineTimeMin: runCalcs.reduce((s, r) => s + r.machineTimeMin, 0),
    mainRunPlatesCount,
  }
}
