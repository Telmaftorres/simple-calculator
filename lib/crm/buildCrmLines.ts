import type { CrmPushLine } from '@/app/actions/crm-push'

export type CrmLinesInput = {
  plateName: string | null
  platesCount: number
  materialCostRaw: number
  materialCostMarged: number
  materialMarginCoeff: number
  printingCost: number        // total impression (encre + machine + calage) — déjà margé
  hasImpression: boolean
  cuttingCost: number
  assemblyCost: number
  hasFaconnage: boolean
  consumablesCost: number
  packagingCost: number
  hasConditionnement: boolean
  accessoriesCost: number
  hasAccessoires: boolean
  accessoriesMargePercent: number
  packagingTotalCost: number
  hasPackaging: boolean
  packagingBoxType?: string | null
  beTotalCost: number
  hasBE: boolean
  dossierFeeCost: number
  hasDossierFee: boolean
  fournituresEmbCost?: number
  hasFournituresEmb?: boolean
  paletteCost?: number
  hasPalette?: boolean
  transportCostMarged: number
  transportTotal: number
  transportMargin: number
}

export function buildCrmLines(p: CrmLinesInput): CrmPushLine[] {
  const lines: CrmPushLine[] = []

  if (p.hasDossierFee && p.dossierFeeCost > 0) {
    lines.push({ description: 'Frais de dossier', prixAchat: p.dossierFeeCost, marge: 1, prixVente: p.dossierFeeCost })
  }

  if (p.hasFournituresEmb && (p.fournituresEmbCost ?? 0) > 0) {
    lines.push({ description: 'Fournitures emballage', prixAchat: p.fournituresEmbCost!, marge: 1, prixVente: p.fournituresEmbCost! })
  }

  if (p.hasPalette && (p.paletteCost ?? 0) > 0) {
    lines.push({ description: 'Option palette', prixAchat: p.paletteCost!, marge: 1, prixVente: p.paletteCost! })
  }

  if (p.materialCostMarged > 0) {
    const desc = p.plateName
      ? `Matière — ${p.plateName} — ${p.platesCount} plaque(s)`
      : `Matière — ${p.platesCount} plaque(s)`
    lines.push({
      description: desc,
      prixAchat: round(p.materialCostRaw),
      marge: round(p.materialMarginCoeff),
      prixVente: round(p.materialCostMarged),
    })
  }

  if (p.hasImpression && p.printingCost > 0) {
    lines.push({ description: 'Impression', prixAchat: round(p.printingCost), marge: 1, prixVente: round(p.printingCost) })
  }

  if (p.cuttingCost > 0) {
    lines.push({ description: 'Découpe', prixAchat: round(p.cuttingCost), marge: 1, prixVente: round(p.cuttingCost) })
  }

  if (p.hasBE && p.beTotalCost > 0) {
    lines.push({ description: 'Bureau d\'études', prixAchat: round(p.beTotalCost), marge: 1, prixVente: round(p.beTotalCost) })
  }

  if (p.hasFaconnage && p.assemblyCost > 0) {
    const total = p.assemblyCost + p.consumablesCost
    lines.push({ description: 'Façonnage', prixAchat: round(total), marge: 1, prixVente: round(total) })
  }

  if (p.hasConditionnement && p.packagingCost > 0) {
    lines.push({ description: 'Conditionnement', prixAchat: round(p.packagingCost), marge: 1, prixVente: round(p.packagingCost) })
  }

  if (p.hasAccessoires && p.accessoriesCost > 0) {
    const marge = p.accessoriesMargePercent > 0 ? round(p.accessoriesMargePercent) : 1
    const prixAchat = marge > 1 ? round(p.accessoriesCost / marge) : round(p.accessoriesCost)
    lines.push({ description: 'Accessoires', prixAchat, marge, prixVente: round(p.accessoriesCost) })
  }

  if (p.hasPackaging && p.packagingTotalCost > 0) {
    const boxLabel = p.packagingBoxType === 'etui' ? 'Étui' : p.packagingBoxType === 'caisse' ? 'Caisse' : 'Emballage'
    lines.push({ description: `Emballage — ${boxLabel}`, prixAchat: round(p.packagingTotalCost), marge: 1, prixVente: round(p.packagingTotalCost) })
  }

  if (p.transportTotal > 0) {
    lines.push({
      description: 'Transport',
      prixAchat: round(p.transportTotal),
      marge: round(p.transportMargin),
      prixVente: round(p.transportCostMarged),
    })
  }

  return lines
}

function round(v: number): number {
  return Math.round(v * 100) / 100
}
