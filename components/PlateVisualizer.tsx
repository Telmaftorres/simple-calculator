import { Rect } from '@/lib/calculation/imposition'

interface PlateVisualizerProps {
  plate: { width: number; height: number }
  layout: Rect[]
  itemsPerPlate: number
  printSurfacePercent: number
}

export function PlateVisualizer({
  plate,
  layout,
  itemsPerPlate,
  printSurfacePercent,
}: PlateVisualizerProps) {
  if (!layout.length) return null

  // 1. Determine Render Dimensions (Force Landscape)
  const isVertical = plate.height > plate.width
  const renderWidth = isVertical ? plate.height : plate.width
  const renderHeight = isVertical ? plate.width : plate.height

  // 2. Transform Layout (Rotate if needed)
  const transformedLayout = layout.map((rect) => {
    if (isVertical) {
      return {
        x: rect.y,
        y: rect.x,
        width: rect.height,
        height: rect.width,
      }
    }
    return rect
  })

  // 3. Calculate Content Bounds & Offsets for Centering
  let maxContentX = 0
  let maxContentY = 0

  transformedLayout.forEach((r) => {
    maxContentX = Math.max(maxContentX, r.x + r.width)
    maxContentY = Math.max(maxContentY, r.y + r.height)
  })

  const offsetX = (renderWidth - maxContentX) / 2
  const offsetY = (renderHeight - maxContentY) / 2

  // 4. Item Size (from first item of transformed layout)
  const tItemWidth = transformedLayout[0].width
  const tItemHeight = transformedLayout[0].height
  const itemArea = tItemWidth * tItemHeight
  const totalPosesArea = itemsPerPlate * itemArea

  // Total area to be "inked" across all poses
  let remainingFillArea = totalPosesArea * (printSurfacePercent / 100)
  const fillHeights: number[] = []
  
  for (let i = 0; i < transformedLayout.length; i++) {
    const fillAmount = Math.max(0, Math.min(itemArea, remainingFillArea))
    remainingFillArea -= fillAmount
    fillHeights.push((fillAmount / itemArea) * tItemHeight)
  }

  return (
    <div className="w-full aspect-video bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative flex items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${renderWidth} ${renderHeight}`}
        className="w-full h-full max-w-full max-h-full drop-shadow-md"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Plate Background */}
        <rect
          x={0}
          y={0}
          width={renderWidth}
          height={renderHeight}
          fill="white"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* Poses */}
        {transformedLayout.map((rect, index) => {
          const fillHeight = fillHeights[index]

          const finalX = rect.x + offsetX
          const finalY = rect.y + offsetY

          return (
            <g key={index}>
              {/* Pose Outline */}
              <rect
                x={finalX}
                y={finalY}
                width={rect.width}
                height={rect.height}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="4 2"
              />

              {/* Fill (Ink) */}
              {fillHeight > 0 && (
                <rect
                  x={finalX}
                  y={finalY + tItemHeight - fillHeight} // Fill from bottom
                  width={rect.width}
                  height={fillHeight}
                  fill="#9333ea" // Purple-600
                  fillOpacity="0.6"
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend / Info Overlay */}
      <div className="absolute bottom-2 right-2 bg-white/90 text-[10px] p-1 px-2 rounded border shadow-sm text-slate-500">
        Simulation Encrage {printSurfacePercent}%
      </div>
    </div>
  )
}
