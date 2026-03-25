import React from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface GaugeSliderProps {
  label: string
  value: number
  max: number
  min?: number
  unit: string
  onChange: (value: number) => void
  className?: string
  gradientColors?: string // e.g., "from-green-400 to-red-500"
  formatValue?: (value: number) => string
}

export function GaugeSlider({
  label,
  value,
  max,
  min = 0,
  unit,
  onChange,
  className,
  gradientColors = 'from-emerald-400 to-amber-500',
  formatValue,
}: GaugeSliderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">{label}</Label>
        <span className="text-lg font-bold text-slate-700">
          {formatValue ? formatValue(value) : `${value} ${unit}`}
        </span>
      </div>

      <div className="relative h-6 w-full">
        {/* Gradient Background Track */}
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-2 rounded-full bg-gradient-to-r opacity-50 mt-2',
            gradientColors
          )}
        />

        <Slider
          value={[value]}
          max={max}
          min={min}
          step={1}
          onValueChange={(vals: number[]) => onChange(vals[0])}
          className="absolute top-0 w-full"
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 px-1">
        <span>{formatValue ? formatValue(min) : `${min} ${unit}`}</span>
        <span>{formatValue ? formatValue(max) : `${max} ${unit}`}</span>
      </div>
    </div>
  )
}
