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
}

export interface ImpositionResult {
  itemsPerPlate: number
  orientation: 'normal' | 'rotated' | 'mixed'
  layout: Rect[]
}

// ...

export function calculateImposition(
  item: Dimensions,
  plate: Plate,
  spacing: number = 0
): ImpositionResult {
  const { width: iW, height: iH } = item
  const { width: pW, height: pH } = plate

  const calcFit = (available: number, size: number) => {
    if (size <= 0) return 0
    return Math.floor((available + spacing) / (size + spacing))
  }

  // Helper to generate layout for grid
  const generateLayout = (
    rows: number,
    cols: number,
    itemWidth: number,
    itemHeight: number
  ): Rect[] => {
    const layout: Rect[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        layout.push({
          x: c * (itemWidth + spacing),
          y: r * (itemHeight + spacing),
          width: itemWidth,
          height: itemHeight,
        })
      }
    }
    return layout
  }

  // Case 1: Normal Orientation
  const colsNormal = calcFit(pW, iW)
  const rowsNormal = calcFit(pH, iH)
  const totalNormal = colsNormal * rowsNormal

  // Case 2: Rotated Item Orientation
  const colsRotated = calcFit(pW, iH)
  const rowsRotated = calcFit(pH, iW)
  const totalRotated = colsRotated * rowsRotated

  if (totalRotated > totalNormal) {
    return {
      itemsPerPlate: totalRotated,
      orientation: 'rotated',
      layout: generateLayout(rowsRotated, colsRotated, iH, iW), // Width is iH, Height is iW
    }
  }

  return {
    itemsPerPlate: totalNormal,
    orientation: 'normal',
    layout: generateLayout(rowsNormal, colsNormal, iW, iH),
  }
}

/**
 * Calculates the total cost and number of plates required based on quote quantity.
 */
export function calculateQuote(quantity: number, itemsPerPlate: number, plateCost: number) {
  if (itemsPerPlate <= 0) return { platesNeeded: 0, totalCost: 0 }

  const platesNeeded = Math.ceil(quantity / itemsPerPlate)
  const totalCost = platesNeeded * plateCost

  return {
    platesNeeded,
    totalCost,
  }
}
