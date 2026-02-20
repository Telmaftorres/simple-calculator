import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import React from 'react'

export function SectionDisplay({
  number,
  title,
  children,
  color,
}: {
  number: string
  title: string
  children: React.ReactNode
  color: string
}) {
  const borderColors: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50/30',
    blue: 'border-blue-200 bg-blue-50/30',
    purple: 'border-purple-200 bg-purple-50/30',
    orange: 'border-orange-200 bg-orange-50/30',
    pink: 'border-pink-200 bg-pink-50/30',
    teal: 'border-teal-200 bg-teal-50/30',
  }

  const textColors: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    pink: 'text-pink-700',
    teal: 'text-teal-700',
  }

  return (
    <Card className={`border ${borderColors[color] || 'border-slate-200'}`}>
      <CardHeader className="pb-2">
        <CardTitle
          className={`text-lg flex items-center gap-3 ${textColors[color] || 'text-slate-700'}`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-sm border font-bold">
            {number}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function CostRow({
  label,
  value,
  details,
}: {
  label: string
  value: number
  details?: string | null
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium">{value.toFixed(2)} €</span>
      </div>
      {details && <div className="text-[10px] text-slate-400 italic text-right">{details}</div>}
    </div>
  )
}
