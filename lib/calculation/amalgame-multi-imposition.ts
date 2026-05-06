import { calculateImposition } from './imposition'

/**
 * Optimisation d'imposition multi-produits (amalgame).
 *
 * Algorithme : bandes horizontales (strip packing) + recherche binaire sur le
 * nombre de plaques cible T.
 *
 * Pour un T donné, on calcule pour chaque produit la hauteur minimale de bande
 * qui permet d'imprimer ceil(qty / T) plaques suffisantes, en choisissant la
 * meilleure orientation (normal ou rotated). On vérifie ensuite que la somme
 * des bandes tient dans la plaque. Le plus petit T valide est la réponse.
 *
 * Complexité : O(N × log(T_max)) — rapide même pour N = 10 produits.
 */

export interface MultiImpositionProduct {
  name: string
  width: number    // mm, format à plat
  height: number   // mm
  quantity: number
}

export interface MultiImpositionStrip {
  productIndex: number
  productName: string
  posesPerPlate: number  // cols × rows dans cette bande
  cols: number
  rows: number
  rotated: boolean        // true si le produit est orienté 90°
  stripHeightMm: number   // hauteur réelle de la bande sur la plaque
}

export interface MultiImpositionResult {
  feasible: boolean                 // false si les produits ne rentrent pas
  platesNeeded: number              // plaques amalgamées
  posesPerPlate: number[]           // poses de chaque produit par plaque (même ordre que input)
  strips: MultiImpositionStrip[]
  utilization: number               // taux de remplissage 0–1
  // Comparaison avec impression séparée
  separatePlatesTotal: number       // plaques si chaque produit imprimé seul
  separatePlatesPerProduct: number[]
  isBetterThanSeparate: boolean
  savingsPercent: number            // % de plaques économisées (peut être négatif)
}

export function calculateMultiImposition(
  products: MultiImpositionProduct[],
  plate: { width: number; height: number },
  spacingMm: number = 10,
  borderMm: number = 10,
): MultiImpositionResult {
  const n = products.length
  const empty: MultiImpositionResult = {
    feasible: false,
    platesNeeded: 0,
    posesPerPlate: new Array(n).fill(0),
    strips: [],
    utilization: 0,
    separatePlatesTotal: 0,
    separatePlatesPerProduct: new Array(n).fill(0),
    isBetterThanSeparate: false,
    savingsPercent: 0,
  }

  if (n === 0) return empty

  const W = plate.width - 2 * borderMm
  const H = plate.height - 2 * borderMm
  if (W <= 0 || H <= 0) return empty

  // Budget hauteur total = H + spacingMm
  // (formule : sum(rows_i × (dim_i + s)) ≤ H + s)
  const Hbudget = H + spacingMm

  // ── Baseline : chaque produit seul (même algorithme que calculateImposition) ──
  const separatePlatesPerProduct = products.map(p => {
    const imp = calculateImposition(
      { width: p.width, height: p.height },
      plate,
      spacingMm,
      undefined,
      borderMm,
    )
    return imp.itemsPerPlate > 0 ? Math.ceil(p.quantity / imp.itemsPerPlate) : Infinity
  })
  const separatePlatesTotal = separatePlatesPerProduct.reduce(
    (s, v) => s + (isFinite(v) ? v : 0), 0,
  )

  // ── Pour un T donné, calcule la config minimale ─────────────────────────
  type StripConfig = {
    height: number  // rows × (dim + s) — contribue au budget
    rows: number
    cols: number
    rotated: boolean
  }

  function bestStripForProduct(p: MultiImpositionProduct, T: number): StripConfig | null {
    const options: StripConfig[] = []

    // Orientation normale
    const colsN = Math.floor((W + spacingMm) / (p.width + spacingMm))
    if (colsN > 0) {
      const rows = Math.max(1, Math.ceil(p.quantity / (colsN * T)))
      options.push({ height: rows * (p.height + spacingMm), rows, cols: colsN, rotated: false })
    }

    // Orientation rotée
    if (p.width !== p.height) {
      const colsR = Math.floor((W + spacingMm) / (p.height + spacingMm))
      if (colsR > 0) {
        const rows = Math.max(1, Math.ceil(p.quantity / (colsR * T)))
        options.push({ height: rows * (p.width + spacingMm), rows, cols: colsR, rotated: true })
      }
    }

    if (options.length === 0) return null
    return options.reduce((best, o) => o.height < best.height ? o : best)
  }

  function checkT(T: number): {
    feasible: boolean
    configs: (StripConfig | null)[]
    totalH: number
  } {
    let totalH = 0
    const configs: (StripConfig | null)[] = []
    for (let i = 0; i < n; i++) {
      const cfg = bestStripForProduct(products[i], T)
      if (!cfg) return { feasible: false, configs: [], totalH: 0 }
      configs.push(cfg)
      totalH += cfg.height
    }
    return { feasible: totalH <= Hbudget, configs, totalH }
  }

  // ── Recherche binaire sur T ─────────────────────────────────────────────
  let lo = 1
  let hi = Math.max(separatePlatesTotal > 0 ? separatePlatesTotal : 1, 1)

  // Si hi n'est pas faisable, multiplier jusqu'à trouver un T faisable
  let safetyCount = 0
  while (!checkT(hi).feasible && safetyCount < 30) {
    hi = Math.ceil(hi * 2)
    safetyCount++
  }

  if (!checkT(hi).feasible) {
    // Les produits ne rentrent pas même seuls sur la plaque
    return { ...empty, separatePlatesTotal, separatePlatesPerProduct }
  }

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (checkT(mid).feasible) hi = mid
    else lo = mid + 1
  }

  const optimal = checkT(lo)
  if (!optimal.feasible) return { ...empty, separatePlatesTotal, separatePlatesPerProduct }

  // ── Construire le résultat ──────────────────────────────────────────────
  const posesPerPlate = optimal.configs.map((cfg) =>
    cfg ? cfg.cols * cfg.rows : 0,
  )

  const strips: MultiImpositionStrip[] = optimal.configs.map((cfg, i) => {
    if (!cfg) return { productIndex: i, productName: products[i].name, posesPerPlate: 0, cols: 0, rows: 0, rotated: false, stripHeightMm: 0 }
    const dimH = cfg.rotated ? products[i].width : products[i].height
    return {
      productIndex: i,
      productName: products[i].name,
      posesPerPlate: cfg.cols * cfg.rows,
      cols: cfg.cols,
      rows: cfg.rows,
      rotated: cfg.rotated,
      stripHeightMm: cfg.rows * dimH + (cfg.rows - 1) * spacingMm,
    }
  })

  // Nombre réel de plaques : max(ceil(qty_i / posesPerPlate_i))
  // Peut être ≤ lo grâce aux arrondis favorables
  const actualPlatesNeeded = Math.max(
    ...posesPerPlate.map((poses, i) =>
      poses > 0 ? Math.ceil(products[i].quantity / poses) : lo,
    ),
  )

  const totalProductArea = products.reduce((sum, p, i) => {
    return sum + Math.min(posesPerPlate[i] * actualPlatesNeeded, p.quantity) * p.width * p.height
  }, 0)
  const utilization = actualPlatesNeeded > 0 ? totalProductArea / (actualPlatesNeeded * W * H) : 0

  const isBetterThanSeparate = actualPlatesNeeded < separatePlatesTotal
  const savingsPercent = separatePlatesTotal > 0
    ? Math.round((1 - actualPlatesNeeded / separatePlatesTotal) * 100)
    : 0

  return {
    feasible: true,
    platesNeeded: actualPlatesNeeded,
    posesPerPlate,
    strips,
    utilization,
    separatePlatesTotal,
    separatePlatesPerProduct: separatePlatesPerProduct.map(v => isFinite(v) ? v : 0),
    isBetterThanSeparate,
    savingsPercent,
  }
}
