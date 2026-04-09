interface ShortcutButtonsProps {
  values: number[]
  selected: number
  onSelect: (val: number) => void
  activeClass: string
  formatValue: (val: number) => string
}

export function ShortcutButtons({ values, selected, onSelect, activeClass, formatValue }: ShortcutButtonsProps) {
  return (
    <div className="flex gap-2">
      {values.map((val) => (
        <button
          key={val}
          onClick={() => onSelect(val)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            selected === val
              ? activeClass
              : 'text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {formatValue(val)}
        </button>
      ))}
    </div>
  )
}
