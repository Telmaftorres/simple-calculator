'use client'

import { Textarea } from '@/components/ui/textarea'
import { SectionDisplay } from '../shared'
import { useCalculatorContext } from '../context/CalculatorContext'

export function SectionActualsExtra() {
  const { actualsNotes, setActualsNotes } = useCalculatorContext()
  return (
    <SectionDisplay number="★" title="Observations — données réelles" color="sky">
      <Textarea
        value={actualsNotes ?? ''}
        onChange={e => setActualsNotes(e.target.value || null)}
        placeholder="Difficultés rencontrées, écarts constatés, points d'amélioration..."
        rows={4}
      />
    </SectionDisplay>
  )
}
