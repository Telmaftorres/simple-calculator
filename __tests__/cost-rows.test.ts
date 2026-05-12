import { describe, it, expect } from 'vitest'
import { buildCostRows } from '@/lib/presentation/quote/cost-rows'
import type { QuoteCostRowsParams } from '@/lib/presentation/quote/cost-rows'

// ── Params de base (tout désactivé sauf le minimum) ──
const base: QuoteCostRowsParams = {
  impositionResult: { itemsPerPlate: 10, platesNeeded: 5, materialCost: 50, orientation: 'normal', layout: [] },
  selectedPlate: { id: 1, name: 'Test', width: 1000, height: 1000, cost: 10, material: 'Test' },
  hasImpression: false,
  inkVolumeL: 0,
  printingCostData: { cost: 0, timeMin: 0, inkCost: 0, machineCost: 0, machineTimeMin: 0, setupCost: 0, laborCost: 0, inkVolumeL: 0, setupTimeMin: 0 },
  printSetupType: 'none',
  cuttingSetupType: 'none',
  cuttingSetupCost: 0,
  cuttingMachineTimeMin: 10,
  cuttingMachineCost: 5,
  hasFaconnage: false,
  assemblyTimePerPieceSeconds: 0,
  assemblyCost: 0,
  selectedConsumables: [],
  consumablesCost: 0,
  hasConditionnement: false,
  hasAssemblyNotice: false,
  hasPoseEtiquette: false,
  packTimePerPieceSeconds: 0,
  packagingCost: 0,
  hasAccessoires: false,
  accessoriesCost: 0,
  selectedAccessories: [],
  hasPackaging: false,
  packagingTotalCost: 0,
  packagingMaterialCost: 0,
  packagingCuttingCost: 0,
  hasBE: false,
  beTimeMinutes: 0,
  batTimeMinutes: 0,
  hasDossierFee: false,
  dossierFeeCost: 0,
  beCost: 0,
  batCost: 0,
  beTotalCost: 0,
  materialCostMarged: 50,
  materialMarginCoeff: 2.5,
}

const labels = (rows: ReturnType<typeof buildCostRows>) => rows.map(r => r.label)

describe('buildCostRows — lignes toujours présentes', () => {
  it('contient toujours la ligne Matière si selectedPlate est défini', () => {
    const rows = buildCostRows(base)
    expect(labels(rows)).toContain('Matière')
  })

  it('contient toujours la ligne Découpe', () => {
    const rows = buildCostRows(base)
    expect(labels(rows)).toContain('Découpe')
  })

  it('n\'apparaît pas si selectedPlate est undefined', () => {
    const rows = buildCostRows({ ...base, selectedPlate: undefined })
    expect(labels(rows)).not.toContain('Matière')
  })
})

describe('buildCostRows — Matière', () => {
  it('affiche le coeff matière dans le détail si materialMarginCoeff != 1', () => {
    const rows = buildCostRows({ ...base, materialMarginCoeff: 2.5 })
    const row = rows.find(r => r.label === 'Matière')!
    expect(row.detail).toContain('×2.5')
  })

  it('affiche le coût plaque dans le détail si materialMarginCoeff == 1', () => {
    const rows = buildCostRows({ ...base, materialMarginCoeff: 1 })
    const row = rows.find(r => r.label === 'Matière')!
    expect(row.detail).toContain('10€')
  })

  it('la valeur de Matière est materialCostMarged', () => {
    const rows = buildCostRows({ ...base, materialCostMarged: 125 })
    const row = rows.find(r => r.label === 'Matière')!
    expect(row.value).toBe(125)
  })
})

describe('buildCostRows — Impression', () => {
  it('n\'affiche pas les lignes d\'impression si hasImpression = false', () => {
    const rows = buildCostRows({ ...base, hasImpression: false })
    expect(labels(rows)).not.toContain('Impression (Encre)')
    expect(labels(rows)).not.toContain('Impression (Machine)')
  })

  it('affiche les lignes d\'impression si hasImpression = true', () => {
    const rows = buildCostRows({
      ...base,
      hasImpression: true,
      inkVolumeL: 0.1,
      printingCostData: { cost: 57, timeMin: 8, inkCost: 45, machineCost: 12, machineTimeMin: 8, setupCost: 0, laborCost: 12, inkVolumeL: 0.1, setupTimeMin: 0 },
    })
    expect(labels(rows)).toContain('Impression (Encre)')
    expect(labels(rows)).toContain('Impression (Machine)')
  })

  it('affiche le calage si printSetupType != none et setupCost > 0', () => {
    const rows = buildCostRows({
      ...base,
      hasImpression: true,
      printSetupType: 'standard',
      printingCostData: { cost: 35, timeMin: 0, inkCost: 0, machineCost: 0, machineTimeMin: 0, setupCost: 35, laborCost: 0, inkVolumeL: 0, setupTimeMin: 0 },
    })
    expect(labels(rows)).toContain('↳ Calage impression (standard)')
  })

  it('n\'affiche pas le calage si setupCost = 0', () => {
    const rows = buildCostRows({
      ...base,
      hasImpression: true,
      printSetupType: 'standard',
      printingCostData: { cost: 0, timeMin: 0, inkCost: 0, machineCost: 0, machineTimeMin: 0, setupCost: 0, laborCost: 0, inkVolumeL: 0, setupTimeMin: 0 },
    })
    expect(labels(rows)).not.toContain('↳ Calage impression (standard)')
  })

  it('n\'affiche pas le calage si printSetupType = none', () => {
    const rows = buildCostRows({
      ...base,
      hasImpression: true,
      printSetupType: 'none',
      printingCostData: { cost: 35, timeMin: 0, inkCost: 0, machineCost: 0, machineTimeMin: 0, setupCost: 35, laborCost: 0, inkVolumeL: 0, setupTimeMin: 0 },
    })
    expect(labels(rows)).not.toContain('↳ Calage impression (none)')
  })
})

describe('buildCostRows — Découpe', () => {
  it('affiche la valeur correcte pour la découpe machine', () => {
    const rows = buildCostRows({ ...base, cuttingMachineCost: 18.5 })
    const row = rows.find(r => r.label === 'Découpe')!
    expect(row.value).toBe(18.5)
  })

  it('affiche le calage découpe si cuttingSetupType != none et cuttingSetupCost > 0', () => {
    const rows = buildCostRows({ ...base, cuttingSetupType: 'complexe', cuttingSetupCost: 55 })
    expect(labels(rows)).toContain('↳ Calage découpe (complexe)')
  })

  it('n\'affiche pas le calage découpe si cuttingSetupCost = 0', () => {
    const rows = buildCostRows({ ...base, cuttingSetupType: 'standard', cuttingSetupCost: 0 })
    expect(labels(rows)).not.toContain('↳ Calage découpe (standard)')
  })
})

describe('buildCostRows — Bureau d\'études', () => {
  it('n\'affiche pas BE si hasBE = false', () => {
    const rows = buildCostRows({ ...base, hasBE: false, beTotalCost: 90 })
    expect(labels(rows)).not.toContain('Bureau d\'études')
  })

  it('n\'affiche pas BE si beTotalCost = 0', () => {
    const rows = buildCostRows({ ...base, hasBE: true, beTotalCost: 0 })
    expect(labels(rows)).not.toContain('Bureau d\'études')
  })

  it('affiche BE avec la bonne valeur si hasBE = true et beTotalCost > 0', () => {
    const rows = buildCostRows({ ...base, hasBE: true, beTimeMinutes: 60, beCost: 90, beTotalCost: 90 })
    const row = rows.find(r => r.label === 'Bureau d\'études')!
    expect(row).toBeDefined()
    expect(row.value).toBe(90)
    expect(row.detail).toContain('60 min')
  })

  it('affiche BAT en sous-ligne si batTimeMinutes > 0', () => {
    const rows = buildCostRows({
      ...base,
      hasBE: true,
      beTimeMinutes: 60,
      batTimeMinutes: 30,
      beCost: 90,
      batCost: 35,
      beTotalCost: 125,
    })
    const batRow = rows.find(r => r.label === '↳ BAT')!
    expect(batRow).toBeDefined()
    expect(batRow.value).toBe(35)
    expect(batRow.sub).toBe(true)
  })

  it('n\'affiche pas BAT si batTimeMinutes = 0', () => {
    const rows = buildCostRows({
      ...base,
      hasBE: true,
      beTimeMinutes: 60,
      batTimeMinutes: 0,
      beCost: 90,
      beTotalCost: 90,
    })
    expect(labels(rows)).not.toContain('↳ BAT')
  })
})

describe('buildCostRows — Façonnage', () => {
  it('n\'affiche pas Façonnage si hasFaconnage = false', () => {
    const rows = buildCostRows({ ...base, hasFaconnage: false, assemblyCost: 50 })
    expect(labels(rows)).not.toContain('Façonnage')
  })

  it('affiche Façonnage avec la bonne valeur si hasFaconnage = true', () => {
    const rows = buildCostRows({
      ...base,
      hasFaconnage: true,
      assemblyTimePerPieceSeconds: 30,
      assemblyCost: 37.5,
    })
    const row = rows.find(r => r.label === 'Façonnage')!
    expect(row.value).toBe(37.5)
    expect(row.detail).toContain('30s/pce')
  })

  it('affiche les consommables en sous-ligne si hasFaconnage = true et consommables > 0', () => {
    const rows = buildCostRows({
      ...base,
      hasFaconnage: true,
      assemblyCost: 20,
      selectedConsumables: [{ id: 1, name: 'Scotch', price: 5, size: 50, sizePerItem: 0.5, quantity: 100 }],
      consumablesCost: 5,
    })
    const row = rows.find(r => r.label === '↳ Consommables')!
    expect(row).toBeDefined()
    expect(row.sub).toBe(true)
    expect(row.value).toBe(5)
  })

  it('n\'affiche pas les consommables si selectedConsumables est vide', () => {
    const rows = buildCostRows({ ...base, hasFaconnage: true, selectedConsumables: [], consumablesCost: 0 })
    expect(labels(rows)).not.toContain('↳ Consommables')
  })
})

describe('buildCostRows — Conditionnement', () => {
  it('n\'affiche pas Conditionnement si hasConditionnement = false', () => {
    const rows = buildCostRows({ ...base, hasConditionnement: false, packagingCost: 20 })
    expect(labels(rows)).not.toContain('Conditionnement')
  })

  it('affiche Conditionnement si hasConditionnement = true', () => {
    const rows = buildCostRows({ ...base, hasConditionnement: true, packTimePerPieceSeconds: 20, packagingCost: 25 })
    const row = rows.find(r => r.label === 'Conditionnement')!
    expect(row.value).toBe(25)
    expect(row.detail).toContain('20s/pce')
  })

  it('affiche "Avec notice" dans le détail si hasAssemblyNotice = true', () => {
    const rows = buildCostRows({ ...base, hasConditionnement: true, hasAssemblyNotice: true, packagingCost: 30 })
    const row = rows.find(r => r.label === 'Conditionnement')!
    expect(row.detail).toContain('Avec notice')
  })
})

describe('buildCostRows — Accessoires', () => {
  it('n\'affiche pas Accessoires si hasAccessoires = false', () => {
    const rows = buildCostRows({ ...base, hasAccessoires: false, accessoriesCost: 50 })
    expect(labels(rows)).not.toContain('Accessoires')
  })

  it('n\'affiche pas Accessoires si accessoriesCost = 0', () => {
    const rows = buildCostRows({ ...base, hasAccessoires: true, accessoriesCost: 0 })
    expect(labels(rows)).not.toContain('Accessoires')
  })

  it('affiche Accessoires avec le bon nombre de références', () => {
    const rows = buildCostRows({
      ...base,
      hasAccessoires: true,
      accessoriesCost: 35,
      selectedAccessories: [
        { id: 1, name: 'Grip', price: 2, quantity: 10 },
        { id: 2, name: 'Potence', price: 3, quantity: 5 },
      ],
    })
    const row = rows.find(r => r.label === 'Accessoires')!
    expect(row.value).toBe(35)
    expect(row.detail).toContain('2 réf.')
  })
})

describe('buildCostRows — Emballage', () => {
  it('n\'affiche pas Emballage si hasPackaging = false', () => {
    const rows = buildCostRows({ ...base, hasPackaging: false, packagingTotalCost: 50 })
    expect(labels(rows)).not.toContain('Emballage')
  })

  it('n\'affiche pas Emballage si packagingTotalCost = 0', () => {
    const rows = buildCostRows({ ...base, hasPackaging: true, packagingTotalCost: 0 })
    expect(labels(rows)).not.toContain('Emballage')
  })

  it('affiche Emballage avec matière + découpe dans le détail', () => {
    const rows = buildCostRows({
      ...base,
      hasPackaging: true,
      packagingTotalCost: 47.5,
      packagingMaterialCost: 37.5,
      packagingCuttingCost: 10,
    })
    const row = rows.find(r => r.label === 'Emballage')!
    expect(row.value).toBe(47.5)
    expect(row.detail).toContain('37.50€')
    expect(row.detail).toContain('10.00€')
  })
})

describe('buildCostRows — Transport', () => {
  it('n\'affiche pas Transport si transportTotal = 0', () => {
    const rows = buildCostRows({ ...base, transportTotal: 0 })
    expect(labels(rows)).not.toContain('Transport')
  })

  it('n\'affiche pas Transport si transportTotal est undefined', () => {
    const rows = buildCostRows({ ...base, transportTotal: undefined })
    expect(labels(rows)).not.toContain('Transport')
  })

  it('affiche Transport avec la valeur correcte si transportTotal > 0', () => {
    const rows = buildCostRows({ ...base, transportTotal: 85.5, transportDeliveriesCount: 1 })
    const row = rows.find(r => r.label === 'Transport')!
    expect(row.value).toBe(85.5)
    expect(row.detail).toBe('GEODIS')
  })

  it('affiche le nombre de livraisons si transportDeliveriesCount > 1', () => {
    const rows = buildCostRows({ ...base, transportTotal: 170, transportDeliveriesCount: 3 })
    const row = rows.find(r => r.label === 'Transport')!
    expect(row.detail).toContain('3 livraisons')
  })
})

describe('buildCostRows — Frais de dossier', () => {
  it('n\'affiche pas les frais de dossier si hasDossierFee = false', () => {
    const rows = buildCostRows({ ...base, hasDossierFee: false, dossierFeeCost: 8 })
    expect(labels(rows)).not.toContain('Frais de dossier')
  })

  it('affiche les frais de dossier si hasDossierFee = true et dossierFeeCost > 0', () => {
    const rows = buildCostRows({ ...base, hasDossierFee: true, dossierFeeCost: 8 })
    const row = rows.find(r => r.label === 'Frais de dossier')!
    expect(row.value).toBe(8)
    expect(row.detail).toBe('forfait')
  })

  it('les frais de dossier sont la première ligne du récap', () => {
    const rows = buildCostRows({ ...base, hasDossierFee: true, dossierFeeCost: 8 })
    expect(rows[0].label).toBe('Frais de dossier')
  })
})

describe('buildCostRows — ordre et structure globale', () => {
  it('l\'ordre est : dossier → matière → impression → découpe → BE → façonnage → conditionnement → accessoires → emballage → transport', () => {
    const rows = buildCostRows({
      ...base,
      hasDossierFee: true, dossierFeeCost: 8,
      hasImpression: true,
      printingCostData: { cost: 15, timeMin: 3, inkCost: 10, machineCost: 5, machineTimeMin: 3, setupCost: 0, laborCost: 5, inkVolumeL: 0, setupTimeMin: 0 },
      hasBE: true, beTimeMinutes: 30, beCost: 45, beTotalCost: 45,
      hasFaconnage: true, assemblyCost: 20,
      hasConditionnement: true, packagingCost: 10,
      hasAccessoires: true, accessoriesCost: 15,
      selectedAccessories: [{ id: 1, name: 'x', price: 5, quantity: 3 }],
      hasPackaging: true, packagingTotalCost: 30, packagingMaterialCost: 20, packagingCuttingCost: 10,
      transportTotal: 50,
    })
    const mainLabels = rows.filter(r => !r.sub).map(r => r.label)
    expect(mainLabels.indexOf('Frais de dossier')).toBeLessThan(mainLabels.indexOf('Matière'))
    expect(mainLabels.indexOf('Matière')).toBeLessThan(mainLabels.indexOf('Impression (Encre)'))
    expect(mainLabels.indexOf('Découpe')).toBeLessThan(mainLabels.indexOf('Bureau d\'études'))
    expect(mainLabels.indexOf('Bureau d\'études')).toBeLessThan(mainLabels.indexOf('Façonnage'))
    expect(mainLabels.indexOf('Façonnage')).toBeLessThan(mainLabels.indexOf('Conditionnement'))
    expect(mainLabels.indexOf('Conditionnement')).toBeLessThan(mainLabels.indexOf('Accessoires'))
    expect(mainLabels.indexOf('Accessoires')).toBeLessThan(mainLabels.indexOf('Emballage'))
    expect(mainLabels.indexOf('Emballage')).toBeLessThan(mainLabels.indexOf('Transport'))
  })
})
