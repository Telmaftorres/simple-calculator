/**
 * Interface representing dimensions of a rectangular item (Element or Product).
 */
export interface Dimensions {
  width: number
  height: number
}

/**
 * Interface representing a Plate (material sheet).
 */
export interface Plate {
  width: number
  height: number
}

/**
 * Result of the imposition calculation.
 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
  rotated?: boolean
}

export interface ImpositionResult {
  itemsPerPlate: number
  orientation: 'normal' | 'rotated' | 'mixed'
  layout: Rect[]
}

export function calculateImposition(
  item: Dimensions,
  plate: Plate,
  spacing: number = 0,
  forceOrientation?: 'normal' | 'rotated',
  plateBorderMm: number = 0
): ImpositionResult {
  const { width: iW, height: iH } = item
  // Surface utile = dimensions plaque - 2 bords (haut+bas, gauche+droite)
  const pW = Math.max(0, plate.width - 2 * plateBorderMm)
  const pH = Math.max(0, plate.height - 2 * plateBorderMm)

  const calcFit = (available: number, size: number) => {
    if (size <= 0) return 0
    return Math.floor((available + spacing) / (size + spacing))
  }

  const generateLayout = (
    rows: number,
    cols: number,
    itemWidth: number,
    itemHeight: number,
    offsetX: number = 0,
    offsetY: number = 0,
    rotated: boolean = false
  ): Rect[] => {
    const layout: Rect[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        layout.push({
          x: offsetX + c * (itemWidth + spacing),
          y: offsetY + r * (itemHeight + spacing),
          width: itemWidth,
          height: itemHeight,
          rotated,
        })
      }
    }
    return layout
  }

  // ── Orientation normale ──
  const colsNormal = calcFit(pW, iW)
  const rowsNormal = calcFit(pH, iH)
  const totalNormal = colsNormal * rowsNormal

  // ── Orientation rotée ──
  const colsRotated = calcFit(pW, iH)
  const rowsRotated = calcFit(pH, iW)
  const totalRotated = colsRotated * rowsRotated

  // ── Orientation mixte ──
  // Stratégie : bandes horizontales — on remplit des lignes normales,
  // puis on utilise l'espace vertical restant avec des lignes rotées
  const tryMixed = (): ImpositionResult | null => {
    let bestMixed: ImpositionResult | null = null

    // Cas A : lignes normales en haut, lignes rotées en bas
    for (let rN = 1; rN <= rowsNormal; rN++) {
      const usedHeightNormal = rN * (iH + spacing) - spacing
      const remainingHeight = pH - usedHeightNormal - spacing

      if (remainingHeight <= 0) continue

      const rowsR = calcFit(remainingHeight, iW)
      const colsR = calcFit(pW, iH)

      if (rowsR <= 0 || colsR <= 0) continue

      const total = rN * colsNormal + rowsR * colsR

      if (total > (bestMixed?.itemsPerPlate ?? 0)) {
        const layoutNormal = generateLayout(rN, colsNormal, iW, iH, 0, 0, false)
        const offsetY = rN * (iH + spacing)
        const layoutRotated = generateLayout(rowsR, colsR, iH, iW, 0, offsetY, true)

        bestMixed = {
          itemsPerPlate: total,
          orientation: 'mixed',
          layout: [...layoutNormal, ...layoutRotated],
        }
      }
    }

    // Cas B : lignes rotées en haut, lignes normales en bas
    for (let rR = 1; rR <= rowsRotated; rR++) {
      const usedHeightRotated = rR * (iW + spacing) - spacing
      const remainingHeight = pH - usedHeightRotated - spacing

      if (remainingHeight <= 0) continue

      const rowsN = calcFit(remainingHeight, iH)
      const colsN = calcFit(pW, iW)

      if (rowsN <= 0 || colsN <= 0) continue

      const total = rR * colsRotated + rowsN * colsN

      if (total > (bestMixed?.itemsPerPlate ?? 0)) {
        const layoutRotated = generateLayout(rR, colsRotated, iH, iW, 0, 0, true)
        const offsetY = rR * (iW + spacing)
        const layoutNormal = generateLayout(rowsN, colsN, iW, iH, 0, offsetY, false)

        bestMixed = {
          itemsPerPlate: total,
          orientation: 'mixed',
          layout: [...layoutRotated, ...layoutNormal],
        }
      }
    }

    return bestMixed
  }

  // ── Orientation forcée ──
  if (forceOrientation === 'normal') {
    return { itemsPerPlate: totalNormal, orientation: 'normal', layout: generateLayout(rowsNormal, colsNormal, iW, iH) }
  }
  if (forceOrientation === 'rotated') {
    return { itemsPerPlate: totalRotated, orientation: 'rotated', layout: generateLayout(rowsRotated, colsRotated, iH, iW) }
  }

  const mixedResult = tryMixed()

  // ── Choisir la meilleure orientation ──
  const best = [
    { total: totalNormal, type: 'normal' as const },
    { total: totalRotated, type: 'rotated' as const },
    { total: mixedResult?.itemsPerPlate ?? 0, type: 'mixed' as const },
  ].reduce((a, b) => (b.total > a.total ? b : a))

  if (best.type === 'mixed' && mixedResult) {
    return mixedResult
  }

  if (best.type === 'rotated') {
    return {
      itemsPerPlate: totalRotated,
      orientation: 'rotated',
      layout: generateLayout(rowsRotated, colsRotated, iH, iW),
    }
  }

  return {
    itemsPerPlate: totalNormal,
    orientation: 'normal',
    layout: generateLayout(rowsNormal, colsNormal, iW, iH),
  }
}
