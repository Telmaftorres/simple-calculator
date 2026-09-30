import { PACKAGING_SUPPLIER_PRICING_ENABLED } from '@/lib/config/pricing'
import { buildPrintInfo } from '@/lib/presentation/print-info'
import { formatMinutes } from '@/lib/format'
import type { ImpositionResult, PrintingCostData, SelectedAccessory, SelectedConsumable, Plate } from '@/types/calculator'

export type CostRow = {
  label: string
  detail: string
  value: number
  sub?: boolean
}

export type QuoteCostRowsParams = {
  impositionResult: ImpositionResult | null | undefined
  selectedPlate: Plate | undefined
  hasImpression: boolean
  hasVarnish?: boolean
  varnishType?: string | null
  varnishSurfacePercent?: number
  hasFlatColor?: boolean
  flatColorSurfacePercent?: number
  inkVolumeL: number
  printingCostData: PrintingCostData
  printSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  cuttingSetupCost: number
  cuttingMachineTimeMin: number
  cuttingMachineCost: number
  hasFaconnage: boolean
  assemblyTimePerPieceSeconds: number
  assemblyCost: number
  selectedConsumables: SelectedConsumable[]
  consumablesCost: number
  hasConditionnement: boolean
  hasAssemblyNotice: boolean
  hasPoseEtiquette: boolean
  packTimePerPieceSeconds: number
  packagingCost: number
  hasAccessoires: boolean
  accessoriesCost: number
  selectedAccessories: SelectedAccessory[]
  hasPackaging: boolean
  packagingTotalCost: number
  packagingMaterialCost: number
  packagingCuttingCost: number
  packagingBoxType?: string | null
  packagingMaterialType?: string | null
  packagingExternalSize?: string | null
  packagingExternalUnitPrice?: number
  effectivePackagingUnitPrice?: number
  packagingQuantity?: number
  hasBE?: boolean
  beTimeMinutes?: number
  batTimeMinutes?: number
  hasDossierFee?: boolean
  dossierFeeCost?: number
  hasFournituresEmb?: boolean
  fournituresEmbCost?: number
  hasPalette?: boolean
  paletteCost?: number
  paletteQuantity?: number
  modePrototype?: boolean
  prototypeFeeCost?: number
  commissionCost?: number
  beCost?: number
  batCost?: number
  beTotalCost?: number
  transportTotal?: number
  transportCostMarged?: number
  transportMargin?: number
  transportDeliveriesCount?: number
  materialCostMarged?: number
  materialMarginCoeff?: number
  mode?: 'internal' | 'client'
}

function boxTypeLabel(t: string | null | undefined): string {
  if (t === 'etui') return 'Étui'
  if (t === 'caisse') return 'Caisse'
  if (t === 'plaque_rainee') return 'Plaque rainée'
  return t ?? ''
}

function sizeLabel(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Détail interne de la ligne « Impression (machine) » : temps total, temps par plaque,
// plaques sur le plateau, vernis (type · %) et blanc (%)
function printMachineDetail(p: QuoteCostRowsParams): string {
  const tb = p.printingCostData.timeBreakdown
  const info = buildPrintInfo({
    hasVarnish: p.hasVarnish ?? false, varnishType: p.varnishType, varnishSurfacePercent: p.varnishSurfacePercent,
    hasFlatColor: p.hasFlatColor ?? false, flatColorSurfacePercent: p.flatColorSurfacePercent,
  })
  const parts = [`${Math.round(p.printingCostData.machineTimeMin)} min`]
  if (tb && tb.totalMin > 0 && tb.totalMin === p.printingCostData.machineTimeMin) {
    parts.push(`${formatMinutes(tb.perPlateMin)}/plaque`, `${tb.platesPerTray} pl./plateau`)
  }
  if (info.varnish) parts.push(`Vernis ${info.varnish}`)
  if (info.white) parts.push(`Blanc ${info.white}`)
  return parts.join(' · ')
}

export function buildCostRows(p: QuoteCostRowsParams): CostRow[] {
  const isClient = p.mode === 'client'

  return [
    ...(p.modePrototype && p.prototypeFeeCost && p.prototypeFeeCost > 0 ? [
      { label: 'Forfait prototype (BE + dossier)', detail: 'forfait', value: p.prototypeFeeCost },
    ] : []),
    ...(p.hasDossierFee && p.dossierFeeCost && p.dossierFeeCost > 0 ? [
      { label: 'Frais de dossier', detail: 'forfait', value: p.dossierFeeCost },
    ] : []),
    ...(p.fournituresEmbCost && p.fournituresEmbCost > 0 ? [
      { label: 'Consommables emballage', detail: 'forfait', value: p.fournituresEmbCost },
    ] : []),
    ...(p.hasPalette && p.paletteCost && p.paletteCost > 0 ? [
      { label: 'Option palette', detail: p.paletteQuantity && p.paletteQuantity > 1 ? `× ${p.paletteQuantity}` : 'forfait', value: p.paletteCost },
    ] : []),
    ...(p.selectedPlate ? [{
      label: 'Matière',
      detail: isClient
        ? `${p.impositionResult?.platesNeeded ?? 0} plaque(s)`
        : p.materialMarginCoeff && p.materialMarginCoeff !== 1
          ? `${p.impositionResult?.platesNeeded} plaque(s) × coeff. ×${p.materialMarginCoeff.toFixed(1)}`
          : `${p.impositionResult?.platesNeeded} plaque(s) × ${p.selectedPlate?.cost}€`,
      value: p.materialCostMarged ?? p.impositionResult?.materialCost ?? 0,
    }] : []),
    ...(p.hasImpression ? [
      { label: 'Impression (encre)', detail: isClient ? '—' : `${p.inkVolumeL.toFixed(3)} L`, value: p.printingCostData.inkCost },
      {
        label: 'Impression (machine)',
        detail: isClient ? '—' : printMachineDetail(p),
        value: isClient
          ? p.printingCostData.machineCost + (p.printSetupType !== 'none' ? (p.printingCostData.setupCost ?? 0) : 0)
          : p.printingCostData.machineCost,
      },
      ...(!isClient && p.printSetupType !== 'none' && p.printingCostData.setupCost > 0 ? [
        { label: `↳ Calage impression (${p.printSetupType})`, detail: 'forfait', value: p.printingCostData.setupCost, sub: true },
      ] : []),
    ] : []),
    ...(p.cuttingMachineCost > 0 || p.cuttingSetupCost > 0 ? [
      {
        label: 'Découpe',
        detail: isClient ? '—' : `${Math.round(p.cuttingMachineTimeMin)} min`,
        value: p.cuttingMachineCost + p.cuttingSetupCost,
      },
    ] : []),
    ...(p.hasBE && p.beTotalCost && p.beTotalCost > 0 ? [
      { label: 'Bureau d\'études', detail: isClient ? '—' : `${p.beTimeMinutes ?? 0} min`, value: p.beCost ?? 0 },
      ...(p.batTimeMinutes && p.batTimeMinutes > 0 ? [
        { label: '↳ BAT', detail: isClient ? '—' : `${p.batTimeMinutes} min`, value: p.batCost ?? 0, sub: true },
      ] : []),
    ] : []),
    ...(p.hasFaconnage ? [
      { label: 'Façonnage', detail: isClient ? '—' : `${p.assemblyTimePerPieceSeconds}s/pce`, value: p.assemblyCost },
      ...(p.selectedConsumables.length > 0 ? [
        { label: '↳ Consommables', detail: `${p.selectedConsumables.length} type(s)`, value: p.consumablesCost, sub: true },
      ] : []),
    ] : []),
    ...(p.hasConditionnement ? [
      {
        label: 'Conditionnement',
        detail: isClient ? '—' : (p.hasAssemblyNotice || p.hasPoseEtiquette) ? [p.hasAssemblyNotice ? 'Notice' : null, p.hasPoseEtiquette ? 'Étiquette' : null].filter(Boolean).join(' + ') : `${p.packTimePerPieceSeconds}s/pce`,
        value: p.packagingCost,
      },
    ] : []),
    ...(p.hasAccessoires && p.accessoriesCost > 0 ? [
      { label: 'Accessoires', detail: `${p.selectedAccessories.length} réf.`, value: p.accessoriesCost },
    ] : []),
    ...(p.hasPackaging && p.packagingTotalCost > 0 ? (() => {
      const isExternal = p.packagingMaterialType === 'B' || p.packagingMaterialType === 'EB'

      // Interne, matière produite en interne (C/BC) : détail matière / découpe sur deux lignes,
      // comme dans le récap du calculateur — inchangé côté client (une seule ligne résumée).
      if (!isExternal && !isClient) {
        return [
          { label: 'Emballage (matière)', detail: '', value: p.packagingMaterialCost },
          { label: 'Emballage (découpe)', detail: '', value: p.packagingCuttingCost },
        ]
      }

      return [{
        label: (() => {
          const parts: string[] = ['Emballage']
          if (p.packagingBoxType) parts.push(`— ${boxTypeLabel(p.packagingBoxType)}`)
          if (p.packagingMaterialType) {
            const sizePart = PACKAGING_SUPPLIER_PRICING_ENABLED && isExternal && p.packagingExternalSize ? ` (${sizeLabel(p.packagingExternalSize)})` : ''
            parts.push(`${p.packagingMaterialType}${sizePart}`)
          }
          return parts.join(' ')
        })(),
        detail: (() => {
          if (isExternal) {
            if (isClient) return 'Fournisseur externe'
            const displayPrice = p.effectivePackagingUnitPrice ?? p.packagingExternalUnitPrice
            return displayPrice && displayPrice > 0
              ? `Fournisseur externe — ${displayPrice.toFixed(4)} €/pce`
              : 'Fournisseur externe'
          }
          return '—'
        })(),
        value: p.packagingTotalCost,
      }]
    })() : []),
    ...(p.transportTotal !== undefined && p.transportTotal > 0 ? [
      {
        label: 'Transport',
        detail: isClient
          ? (p.transportDeliveriesCount && p.transportDeliveriesCount > 1
              ? `${p.transportDeliveriesCount} livraisons`
              : 'GEODIS')
          : (() => {
              const base = p.transportDeliveriesCount && p.transportDeliveriesCount > 1
                ? `${p.transportDeliveriesCount} livraisons`
                : 'GEODIS'
              return p.transportMargin && p.transportMargin !== 1
                ? `${base} × coeff. ×${p.transportMargin.toFixed(2)}`
                : base
            })(),
        value: p.transportCostMarged ?? p.transportTotal,
      },
    ] : []),
    ...(!isClient && p.commissionCost && p.commissionCost > 0 ? [
      { label: 'Marge commerciale + Sopano', detail: 'incluse', value: p.commissionCost },
    ] : []),
  ]
}
