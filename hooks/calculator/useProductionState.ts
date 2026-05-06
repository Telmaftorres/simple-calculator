'use client'

import { useState } from 'react'

interface ProductionSheetExtra {
  status?: string
  remarques?: string | null
  planImageUrl?: string | null
  nbCollages?: number | null
  collagePerPLV?: number | null
  faconnageNotes?: string | null
  conditionnementType?: string | null
  conditionnementNotes?: string | null
  achatsNotes?: string | null
}

export function useProductionState(extra?: ProductionSheetExtra | null) {
  const [prodStatus, setProdStatus] = useState<'en_attente' | 'en_cours' | 'termine'>(
    (extra?.status as 'en_attente' | 'en_cours' | 'termine') ?? 'en_attente'
  )
  const [prodRemarques, setProdRemarques] = useState<string | null>(extra?.remarques ?? null)
  const [prodPlanImageUrl, setProdPlanImageUrl] = useState<string | null>(extra?.planImageUrl ?? null)
  const [prodNbCollages, setProdNbCollages] = useState<number | null>(extra?.nbCollages ?? null)
  const [prodCollagePerPLV, setProdCollagePerPLV] = useState<number | null>(extra?.collagePerPLV ?? null)
  const [prodFaconnageNotes, setProdFaconnageNotes] = useState<string | null>(extra?.faconnageNotes ?? null)
  const [prodConditionnementType, setProdConditionnementType] = useState<string | null>(extra?.conditionnementType ?? null)
  const [prodConditionnementNotes, setProdConditionnementNotes] = useState<string | null>(extra?.conditionnementNotes ?? null)
  const [prodAchatsNotes, setProdAchatsNotes] = useState<string | null>(extra?.achatsNotes ?? null)
  const [actualsNotes, setActualsNotes] = useState<string | null>(null)

  return {
    prodStatus, setProdStatus,
    prodRemarques, setProdRemarques,
    prodPlanImageUrl, setProdPlanImageUrl,
    prodNbCollages, setProdNbCollages,
    prodCollagePerPLV, setProdCollagePerPLV,
    prodFaconnageNotes, setProdFaconnageNotes,
    prodConditionnementType, setProdConditionnementType,
    prodConditionnementNotes, setProdConditionnementNotes,
    prodAchatsNotes, setProdAchatsNotes,
    actualsNotes, setActualsNotes,
  }
}
