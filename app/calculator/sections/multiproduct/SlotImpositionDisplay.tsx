'use client'

import { useState } from 'react'
import type { ImpositionResult } from '@/types/calculator'

export function SlotImpositionDisplay({
  impositionResult,
  orientationOverride,
  onOrientationChange,
  bordABord,
  onBordABordChange,
  itemsPerPlateOverride,
  onItemsPerPlateOverrideChange,
}: {
  impositionResult: ImpositionResult
  orientationOverride: 'normal' | 'rotated' | null
  onOrientationChange: (v: 'normal' | 'rotated' | null) => void
  bordABord: boolean
  onBordABordChange: (v: boolean) => void
  itemsPerPlateOverride: number | null
  onItemsPerPlateOverrideChange: (v: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ORIENTATION_LABELS = { normal: 'Horizontal', rotated: 'Vertical', mixed: 'Mix' }
  const isOverridden = orientationOverride !== null
  const displayLabel = isOverridden
    ? (orientationOverride === 'normal' ? 'Horizontal ✎' : 'Vertical ✎')
    : ORIENTATION_LABELS[impositionResult.orientation]

  return (
    <div className="space-y-2">
    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600">{impositionResult.itemsPerPlate}</div>
        <div className="text-xs text-blue-400 uppercase">Poses / Plaque</div>
      </div>
      <div className="text-center relative">
        <button
          onClick={() => setOpen(!open)}
          className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${isOverridden ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' : 'hover:bg-blue-100 text-slate-600'}`}
        >
          {displayLabel}
        </button>
        <div className="text-xs text-slate-400">Orientation</div>
        {open && (
          <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden text-sm min-w-[140px]">
            {isOverridden && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-500 italic border-b border-slate-100"
                onClick={() => { onOrientationChange(null); setOpen(false) }}
              >
                ↩ Remettre en auto
              </button>
            )}
            {orientationOverride !== 'normal' && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-medium"
                onClick={() => { onOrientationChange('normal'); setOpen(false) }}
              >
                Forcer Horizontal
              </button>
            )}
            {orientationOverride !== 'rotated' && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-medium"
                onClick={() => { onOrientationChange('rotated'); setOpen(false) }}
              >
                Forcer Vertical
              </button>
            )}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-slate-700">{impositionResult.platesNeeded}</div>
        <div className="text-xs text-slate-400 uppercase">Plaques nécessaires</div>
      </div>
    </div>
      <div className="flex gap-2">
        <button
          onClick={() => onBordABordChange(!bordABord)}
          className={`flex-1 flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium border transition-all ${
            bordABord
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          <span>Bord à bord</span>
          <span className={`text-xs font-normal ${bordABord ? 'text-blue-200' : 'text-slate-400'}`}>
            {bordABord ? '0 mm' : 'std'}
          </span>
        </button>
        <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2 bg-white">
          <span className="text-xs text-slate-400 whitespace-nowrap">Poses/plaque</span>
          <input
            type="number"
            min={1}
            placeholder="auto"
            value={itemsPerPlateOverride ?? ''}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              onItemsPerPlateOverrideChange(isNaN(v) || v <= 0 ? null : v)
            }}
            className="w-14 text-sm font-semibold text-blue-700 text-right bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  )
}
