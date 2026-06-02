'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
    >
      <Printer className="h-4 w-4" /> Imprimer / Exporter PDF
    </button>
  )
}
