'use client'

import { SectionDisplay } from '../shared'

export function SectionTransport() {
  return (
    <SectionDisplay
      number="10"
      title="Transport"
      color="gray"
      enabled={false}
      onToggle={() => {}}
    >
      <div className="text-center py-4 text-slate-400 text-sm italic">
        Module transport — disponible prochainement
      </div>
    </SectionDisplay>
  )
}