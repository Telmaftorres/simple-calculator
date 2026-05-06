'use client'

import { MultiProductSlotEditor } from './multiproduct/MultiProductSlotEditor'
import { AmalgameGroupsPanel } from './multiproduct/AmalgameGroupsPanel'

export function SectionMultiProduct() {
  return (
    <div className="space-y-4">
      <MultiProductSlotEditor />
      <AmalgameGroupsPanel />
    </div>
  )
}
