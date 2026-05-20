'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Suggestion = { label: string; sublabel?: string }

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  onSelect,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: Suggestion[]
  placeholder?: string
  className?: string
  onSelect?: (s: Suggestion) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim().length === 0
    ? suggestions
    : suggestions.filter(s =>
        s.label.toLowerCase().includes(value.toLowerCase()) ||
        (s.sublabel ?? '').toLowerCase().includes(value.toLowerCase())
      )

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  const handleSelect = (s: Suggestion) => {
    onChange(s.label)
    onSelect?.(s)
    close()
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-full min-w-[200px] max-h-52 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left gap-2"
            >
              <span className="truncate">{s.label}</span>
              {s.sublabel && <span className="text-xs text-slate-400 shrink-0">{s.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
