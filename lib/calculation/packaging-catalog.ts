import type { PackagingRulesData } from '@/app/actions/reference-data'
import {
  PACKAGING_B_PETIT_PRICE, PACKAGING_B_MOYEN_PRICE, PACKAGING_B_GRAND_PRICE,
  PACKAGING_EB_PETIT_PRICE, PACKAGING_EB_MOYEN_PRICE, PACKAGING_EB_GRAND_PRICE,
} from '@/lib/config/pricing'

const DEFAULTS: Record<string, number> = {
  PACKAGING_B_PETIT_PRICE, PACKAGING_B_MOYEN_PRICE, PACKAGING_B_GRAND_PRICE,
  PACKAGING_EB_PETIT_PRICE, PACKAGING_EB_MOYEN_PRICE, PACKAGING_EB_GRAND_PRICE,
}

// Prix catalogue B/EB (€/pce) tel que calculé par l'ancien système "devis fournisseurs" :
// prix moyen de la règle (type × matière × taille) × coefficient de quantité, sinon réglage.
export function legacyPackagingCatalogPrice(p: {
  materialType: string | null | undefined
  size: string | null | undefined
  boxType: string | null | undefined
  quantity: number
  settings?: Record<string, number>
  rules?: PackagingRulesData
}): number {
  if ((p.materialType !== 'B' && p.materialType !== 'EB') || !p.size || p.quantity <= 0) return 0
  const mat = p.materialType.toUpperCase()
  const sz = p.size.toUpperCase()
  const rule = p.rules?.rules?.find(r => r.category === (p.boxType || 'etui').toUpperCase() && r.material === mat && r.size === sz)
  if (rule) {
    const band = p.rules?.coefficients?.find(
      c => p.quantity >= c.minQuantity && (c.maxQuantity === null || p.quantity <= c.maxQuantity)
    )
    return band ? Math.round(rule.baseUnitPrice * band.coefficient * 10000) / 10000 : rule.baseUnitPrice
  }
  const key = `PACKAGING_${mat}_${sz}_PRICE`
  return p.settings?.[key] ?? DEFAULTS[key] ?? 0
}
