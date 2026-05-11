'use client'

import { useState } from 'react'
import { updateSetting } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react'
import { PackagingPricingClient } from './PackagingPricingClient'
import type { PackagingRuleForAdmin, QuantityCoefficientForAdmin } from '@/app/actions/reference-data'

interface Setting {
  id: number
  key: string
  value: string
  label: string
  unit: string | null
}

// ── Formules et exemples dynamiques par clé ──
const FORMULAS: Record<string, {
  usedIn: string[]
  formula: string
  getExample: (values: Record<string, string>) => string
}> = {
  HOURLY_RATE_PRINT: {
    usedIn: ['Impression (temps machine)', 'Calage impression', 'Découpe (temps machine)', 'Calage découpe'],
    formula: '(temps_min / 60) × taux_horaire_impression',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_PRINT) || 0
      const result = (12 / 60) * rate
      return `(12 min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  PRINT_SETUP_TIME_MIN: {
    usedIn: ['Calage impression'],
    formula: 'si calage activé → setup_cost = (calage_min / 60) × taux_horaire_impression',
    getExample: (v) => {
      const setup = parseFloat(v.PRINT_SETUP_TIME_MIN) || 0
      const rate = parseFloat(v.HOURLY_RATE_PRINT) || 0
      const result = (setup / 60) * rate
      return `(${setup} min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  PRINT_SPEED_PRODUCTION: {
    usedIn: ['Impression (temps machine) — mode Production'],
    formula: 'temps_machine_min = min_par_m² × surface_plaque_m² × multiplicateur × nb_plaques',
    getExample: (v) => {
      const pace = parseFloat(v.PRINT_SPEED_PRODUCTION) || 0
      const plateM2 = 1.92
      const nbPlates = 10
      const result = pace * plateM2 * 1 * nbPlates
      return `${pace} min/m² × ${plateM2} m² × 1 × ${nbPlates} plaques = ${result.toFixed(2)} min`
    },
  },
  PRINT_SPEED_QUALITY: {
    usedIn: ['Impression (temps machine) — mode Qualité'],
    formula: 'temps_machine_min = min_par_m² × surface_plaque_m² × multiplicateur × nb_plaques',
    getExample: (v) => {
      const pace = parseFloat(v.PRINT_SPEED_QUALITY) || 0
      const plateM2 = 1.92
      const nbPlates = 10
      const result = pace * plateM2 * 1 * nbPlates
      return `${pace} min/m² × ${plateM2} m² × 1 × ${nbPlates} plaques = ${result.toFixed(2)} min`
    },
  },
  PRINT_SPEED_VARNISH: {
    usedIn: ['Impression (temps machine) — Vernis'],
    formula: 'temps_vernis_min = min_par_m² × surface_plaque_m² × multiplicateur × nb_plaques',
    getExample: (v) => {
      const pace = parseFloat(v.PRINT_SPEED_VARNISH) || 0
      const plateM2 = 1.92
      const nbPlates = 10
      const result = pace * plateM2 * 1 * nbPlates
      return `${pace} min/m² × ${plateM2} m² × 1 × ${nbPlates} plaques = ${result.toFixed(2)} min (ajout au temps de base)`
    },
  },
  PRINT_SPEED_FLAT_COLOR: {
    usedIn: ['Impression (temps machine) — Blanc'],
    formula: 'temps_blanc_min = min_par_m² × surface_plaque_m² × multiplicateur × nb_plaques',
    getExample: (v) => {
      const pace = parseFloat(v.PRINT_SPEED_FLAT_COLOR) || 0
      const plateM2 = 1.92
      const nbPlates = 10
      const result = pace * plateM2 * 1 * nbPlates
      return `${pace} min/m² × ${plateM2} m² × 1 × ${nbPlates} plaques = ${result.toFixed(2)} min (ajout au temps de base)`
    },
  },
  INK_COST_PER_LITER: {
    usedIn: ['Impression (encre)'],
    formula: 'coût_encre = volume_L × coût_par_litre × (1 + surcharges_finitions)',
    getExample: (v) => {
      const cost = parseFloat(v.INK_COST_PER_LITER) || 0
      const volumeL = 0.32
      const surcharge = 1.05
      const result = volumeL * cost * surcharge
      return `${volumeL} L × ${cost} €/L × ${surcharge} (vernis) = ${result.toFixed(2)} €`
    },
  },
  INK_MARGIN_STANDARD: {
    usedIn: ['Impression (encre standard)'],
    formula: 'coût_encre_margé = volume_L × coût_par_litre × marge',
    getExample: (v) => {
      const margin = parseFloat(v.INK_MARGIN_STANDARD) || 0
      const cost = parseFloat(v.INK_COST_PER_LITER) || 0
      const volumeL = 0.2
      const result = volumeL * cost * margin
      return `${volumeL} L × ${cost} €/L × ${margin} = ${result.toFixed(2)} € facturé`
    },
  },
  INK_COST_VARNISH_PER_LITER: {
    usedIn: ['Impression (encre) — vernis'],
    formula: 'coût_vernis = volume_vernis_L × coût_vernis_par_litre',
    getExample: (v) => {
      const cost = parseFloat(v.INK_COST_VARNISH_PER_LITER) || 0
      const stdCost = parseFloat(v.INK_COST_PER_LITER) || 0
      const inkMl = 20
      const nbPlates = 10
      const varnishPct = 0.30
      const varnishVolumeL = (inkMl * varnishPct * nbPlates) / 1000
      const result = varnishVolumeL * cost
      return `vernis 30% → 20 ml × 30% × ${nbPlates} plaques / 1000 = ${varnishVolumeL.toFixed(3)} L × ${cost} €/L = ${result.toFixed(2)} € (vs ${(varnishVolumeL * stdCost).toFixed(2)} € en encre standard)`
    },
  },
  INK_MARGIN_VARNISH: {
    usedIn: ['Impression (encre vernis)'],
    formula: 'coût_vernis_margé = volume_L × coût_par_litre × marge',
    getExample: (v) => {
      const margin = parseFloat(v.INK_MARGIN_VARNISH) || 0
      const cost = parseFloat(v.INK_COST_VARNISH_PER_LITER) || 0
      const volumeL = 0.06
      const result = volumeL * cost * margin
      return `${volumeL} L × ${cost} €/L × ${margin} = ${result.toFixed(2)} € facturé`
    },
  },
  INK_COST_FLAT_COLOR_PER_LITER: {
    usedIn: ['Impression (encre) — blanc'],
    formula: 'coût_blanc = volume_blanc_L × coût_blanc_par_litre',
    getExample: (v) => {
      const cost = parseFloat(v.INK_COST_FLAT_COLOR_PER_LITER) || 0
      const stdCost = parseFloat(v.INK_COST_PER_LITER) || 0
      const inkMl = 20
      const nbPlates = 10
      const flatPct = 0.20
      const flatVolumeL = (inkMl * flatPct * nbPlates) / 1000
      const result = flatVolumeL * cost
      return `blanc 20% → 20 ml × 20% × ${nbPlates} plaques / 1000 = ${flatVolumeL.toFixed(3)} L × ${cost} €/L = ${result.toFixed(2)} € (vs ${(flatVolumeL * stdCost).toFixed(2)} € en encre standard)`
    },
  },
  INK_MARGIN_FLAT_COLOR: {
    usedIn: ['Impression (encre blanc)'],
    formula: 'coût_blanc_margé = volume_L × coût_par_litre × marge',
    getExample: (v) => {
      const margin = parseFloat(v.INK_MARGIN_FLAT_COLOR) || 0
      const cost = parseFloat(v.INK_COST_FLAT_COLOR_PER_LITER) || 0
      const volumeL = 0.04
      const result = volumeL * cost * margin
      return `${volumeL} L × ${cost} €/L × ${margin} = ${result.toFixed(2)} € facturé`
    },
  },
  HOURLY_RATE_CUTTING: {
    usedIn: ['Découpe (temps machine)', 'Calage découpe'],
    formula: '(temps_min / 60) × taux_horaire_découpe',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_CUTTING) || 0
      const result = (12 / 60) * rate
      return `(12 min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  PRINT_SETUP_STANDARD_COST: {
    usedIn: ['Calage impression — standard'],
    formula: 'forfait fixe ajouté au total si calage standard sélectionné',
    getExample: (v) => {
      const cost = parseFloat(v.PRINT_SETUP_STANDARD_COST) || 0
      return `Calage standard impression = ${cost} € forfait fixe`
    },
  },
  PRINT_SETUP_COMPLEX_COST: {
    usedIn: ['Calage impression — complexe'],
    formula: 'forfait fixe ajouté au total si calage complexe sélectionné',
    getExample: (v) => {
      const cost = parseFloat(v.PRINT_SETUP_COMPLEX_COST) || 0
      return `Calage complexe impression = ${cost} € forfait fixe`
    },
  },
  CUTTING_SETUP_STANDARD_COST: {
    usedIn: ['Calage découpe — standard'],
    formula: 'forfait fixe ajouté au total si calage standard sélectionné',
    getExample: (v) => {
      const cost = parseFloat(v.CUTTING_SETUP_STANDARD_COST) || 0
      return `Calage standard découpe = ${cost} € forfait fixe`
    },
  },
  CUTTING_SETUP_COMPLEX_COST: {
    usedIn: ['Calage découpe — complexe'],
    formula: 'forfait fixe ajouté au total si calage complexe sélectionné',
    getExample: (v) => {
      const cost = parseFloat(v.CUTTING_SETUP_COMPLEX_COST) || 0
      return `Calage complexe découpe = ${cost} € forfait fixe`
    },
  },
  CUTTING_SETUP_MINUTES: {
    usedIn: ['Calage découpe'],
    formula: 'si calage activé → calage_cost = (calage_min / 60) × taux_horaire_impression',
    getExample: (v) => {
      const setup = parseFloat(v.CUTTING_SETUP_MINUTES) || 0
      const rate = parseFloat(v.HOURLY_RATE_PRINT) || 0
      const result = (setup / 60) * rate
      return `(${setup} min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  HOURLY_RATE_ASSEMBLY: {
    usedIn: ['Façonnage', 'Conditionnement'],
    formula: 'coût = (temps_par_pce_sec × quantité / 3600) × taux_horaire_façonnage',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_ASSEMBLY) || 0
      const secPerPce = 30
      const qty = 500
      const result = (secPerPce * qty / 3600) * rate
      return `(${secPerPce} sec × ${qty} pces / 3600) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  ASSEMBLY_NOTICE_COST_PER_PIECE: {
    usedIn: ['Conditionnement'],
    formula: 'coût_notice = quantité_produite × coût_unitaire_notice',
    getExample: (v) => {
      const p = parseFloat(v.ASSEMBLY_NOTICE_COST_PER_PIECE) || 0
      return `Pour 50 présentoirs : 50 × ${p} = ${(50 * p).toFixed(2)} € (ajouté au coût final du conditionnement)`
    },
  },
  HOURLY_RATE_CONDITIONING: {
    usedIn: ['Conditionnement'],
    formula: 'coût = (temps_unitaire_sec × quantité / 3600) × taux_horaire',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_CONDITIONING) || 0
      return `Ex: 2 min/pièce × 30 pièces = 1h. Total = ${rate.toFixed(2)} €`
    },
  },
  POSE_SPACING_MM: {
    usedIn: ['Imposition — calcul des poses par plaque'],
    formula: 'poses = ⌊(largeur_plaque + espacement) / (largeur_pose + espacement)⌋',
    getExample: (v) => {
      const spacing = parseFloat(v.POSE_SPACING_MM) || 0
      const platW = 1200
      const poseW = 100
      const result = Math.floor((platW + spacing) / (poseW + spacing))
      return `⌊(${platW} + ${spacing}) / (${poseW} + ${spacing})⌋ = ⌊${platW + spacing} / ${poseW + spacing}⌋ = ${result} poses/colonne`
    },
  },
  PLATE_BORDER_MM: {
    usedIn: ['Imposition — marge de bord (tous types)'],
    formula: 'surface_utile = (largeur_plaque - 2×marge) × (hauteur_plaque - 2×marge)',
    getExample: (v) => {
      const border = parseFloat(v.PLATE_BORDER_MM) || 0
      const platW = 1200
      const platH = 1600
      const effW = Math.max(0, platW - 2 * border)
      const effH = Math.max(0, platH - 2 * border)
      return `Plaque ${platW}×${platH} mm → zone utile (${platW} - 2×${border}) × (${platH} - 2×${border}) = ${effW}×${effH} mm`
    },
  },
  HOURLY_RATE_PACKAGING: {
    usedIn: ['Emballage (découpe)'],
    formula: 'coût_découpe_emballage = (temps_total_min / 60) × taux_horaire_emballage',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_PACKAGING) || 0
      const totalMin = 25
      const result = (totalMin / 60) * rate
      return `(${totalMin} min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  PACKAGING_SETUP_COST: {
    usedIn: ['Emballage (calage découpe)'],
    formula: 'coût_emballage = (temps_machine_min / 60) × taux_horaire + forfait_calage',
    getExample: (v) => {
      const setup = parseFloat(v.PACKAGING_SETUP_COST) || 0
      const secPerPose = 20
      const qty = 500
      const machineMin = (secPerPose * qty) / 60
      const rate = parseFloat(v.HOURLY_RATE_PACKAGING) || 45
      const machineCost = (machineMin / 60) * rate
      return `(${machineMin.toFixed(2)} min / 60) × ${rate} €/h + ${setup} € = ${machineCost.toFixed(2)} + ${setup} = ${(machineCost + setup).toFixed(2)} €`
    },
  },
  HOURLY_RATE_BE: {
    usedIn: ['Bureau d\'études — Création/BE'],
    formula: 'coût_BE = (temps_min / 60) × taux_horaire_BE',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_BE) || 0
      const timeMin = 60
      const result = (timeMin / 60) * rate
      return `(${timeMin} min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  HOURLY_RATE_BAT: {
    usedIn: ['Bureau d\'études — BAT'],
    formula: 'coût_BAT = (temps_min / 60) × taux_horaire_BAT',
    getExample: (v) => {
      const rate = parseFloat(v.HOURLY_RATE_BAT) || 0
      const timeMin = 45
      const result = (timeMin / 60) * rate
      return `(${timeMin} min / 60) × ${rate} €/h = ${result.toFixed(2)} €`
    },
  },
  MATERIAL_MARGIN_TIER1: {
    usedIn: ['Matière — plaque < 5 €'],
    formula: 'coût_matière_margé = coût_matière_brut × coefficient',
    getExample: (v) => {
      const coeff = parseFloat(v.MATERIAL_MARGIN_TIER1) || 0
      const cost = 10
      return `Matière 10 € brut × ${coeff} = ${(cost * coeff).toFixed(2)} € facturé`
    },
  },
  MATERIAL_MARGIN_TIER2: {
    usedIn: ['Matière — plaque 5 à 10 €'],
    formula: 'coût_matière_margé = coût_matière_brut × coefficient',
    getExample: (v) => {
      const coeff = parseFloat(v.MATERIAL_MARGIN_TIER2) || 0
      const cost = 20
      return `Matière 20 € brut × ${coeff} = ${(cost * coeff).toFixed(2)} € facturé`
    },
  },
  MATERIAL_MARGIN_TIER3: {
    usedIn: ['Matière — plaque 10 à 20 €'],
    formula: 'coût_matière_margé = coût_matière_brut × coefficient',
    getExample: (v) => {
      const coeff = parseFloat(v.MATERIAL_MARGIN_TIER3) || 0
      const cost = 50
      return `Matière 50 € brut × ${coeff} = ${(cost * coeff).toFixed(2)} € facturé`
    },
  },
  MATERIAL_MARGIN_TIER4: {
    usedIn: ['Matière — plaque > 20 €'],
    formula: 'coût_matière_margé = coût_matière_brut × coefficient',
    getExample: (v) => {
      const coeff = parseFloat(v.MATERIAL_MARGIN_TIER4) || 0
      const cost = 100
      return `Matière 100 € brut × ${coeff} = ${(cost * coeff).toFixed(2)} € facturé`
    },
  },

  DOSSIER_FEE: {
    usedIn: ['Frais de dossier'],
    formula: 'si activé → frais_dossier = DOSSIER_FEE',
    getExample: (v) => {
      const fee = parseFloat(v.DOSSIER_FEE) || 0
      return `Frais de dossier activé = ${fee} € forfait fixe`
    },
  },
  MARGE_COMMERCIALE_PERCENT: {
    usedIn: ['Marges internes — Com. commerciale'],
    formula: 'marge_commerciale = total_HT × (pourcentage / 100)',
    getExample: (v) => {
      const pct = parseFloat(v.MARGE_COMMERCIALE_PERCENT) || 0
      const total = 500
      const result = total * (pct / 100)
      return `${total} € × (${pct}% / 100) = ${result.toFixed(2)} € déduit du total`
    },
  },
  MARGE_SOPANO_PERCENT: {
    usedIn: ['Marges internes — Com. Sopano'],
    formula: 'marge_sopano = total_HT × (pourcentage / 100)',
    getExample: (v) => {
      const pct = parseFloat(v.MARGE_SOPANO_PERCENT) || 0
      const total = 500
      const result = total * (pct / 100)
      return `${total} € × (${pct}% / 100) = ${result.toFixed(2)} € déduit du total`
    },
  },
  GEODIS_FUEL_SURCHARGE_PERCENT: {
    usedIn: ['Transport — Surcharge carburant'],
    formula: 'transport_total = (base_HT + options_HT) × (1 + surcharge_% / 100)',
    getExample: (v) => {
      const pct = parseFloat(v.GEODIS_FUEL_SURCHARGE_PERCENT) || 0
      const base = 120
      const result = base * (1 + pct / 100)
      return `Base ${base} € × (1 + ${pct}% / 100) = ${result.toFixed(2)} € TTC surcharge`
    },
  },
  TRANSPORT_MARGIN: {
    usedIn: ['Transport — Marge sur prix GEODIS'],
    formula: 'transport_facturé = transport_GEODIS × coefficient',
    getExample: (v) => {
      const coeff = parseFloat(v.TRANSPORT_MARGIN) || 1
      const geodis = 100
      const result = geodis * coeff
      return `GEODIS ${geodis} € × ${coeff} = ${result.toFixed(2)} € facturé`
    },
  },
}

const CATEGORIES: {
  label: string
  description: string
  color: string
  emoji: string
  keys?: string[]
  subcategories?: { label: string; keys: string[] }[]
}[] = [
  {
    label: 'Impression',
    description: 'Taux horaires, vitesses, encre et calages impression',
    color: 'purple',
    emoji: '🖨️',
    subcategories: [
      {
        label: 'Impression',
        keys: [
          'HOURLY_RATE_PRINT',
          'PRINT_SPEED_PRODUCTION',
          'PRINT_SPEED_QUALITY',
          'PRINT_SPEED_VARNISH',
          'PRINT_SPEED_FLAT_COLOR',
        ],
      },
      {
        label: 'Calage',
        keys: [
          'PRINT_SETUP_STANDARD_COST',
          'PRINT_SETUP_COMPLEX_COST',
        ],
      },
      {
        label: 'Encre',
        keys: [
          'INK_COST_PER_LITER',
          'INK_MARGIN_STANDARD',
          'INK_COST_VARNISH_PER_LITER',
          'INK_MARGIN_VARNISH',
          'INK_COST_FLAT_COLOR_PER_LITER',
          'INK_MARGIN_FLAT_COLOR',
        ],
      },
    ],
  },
  {
    label: 'Découpe',
    description: 'Taux horaire et calages découpe',
    color: 'orange',
    emoji: '✂️',
    keys: [
      'HOURLY_RATE_CUTTING',
      'CUTTING_SETUP_STANDARD_COST',
      'CUTTING_SETUP_COMPLEX_COST',
    ],
  },
  {
    label: 'Façonnage',
    description: 'Taux horaire façonnage',
    color: 'pink',
    emoji: '🔧',
    keys: ['HOURLY_RATE_ASSEMBLY'],
  },
  {
    label: 'Conditionnement',
    description: 'Coûts de la mise en carton et notices',
    color: 'teal',
    emoji: '📦',
    keys: ['HOURLY_RATE_CONDITIONING', 'ASSEMBLY_NOTICE_COST_PER_PIECE'],
  },
  {
    label: 'Imposition',
    description: 'Espacement entre poses et marge de bord de plaque',
    color: 'blue',
    emoji: '📐',
    keys: ['POSE_SPACING_MM', 'PLATE_BORDER_MM'],
  },
  {
    label: 'Emballage',
    description: 'Taux horaire et calage emballage',
    color: 'amber',
    emoji: '🗂️',
    keys: ['HOURLY_RATE_PACKAGING', 'PACKAGING_SETUP_COST'],
  },
  {
    label: 'Bureau d\'études',
    description: 'Taux horaires création/BE et BAT',
    color: 'blue',
    emoji: '📋',
    keys: ['HOURLY_RATE_BE', 'HOURLY_RATE_BAT'],
  },
  {
  label: 'Matière',
    description: 'Coefficients de marge selon le prix de la matière',
    color: 'teal',
    emoji: '🧱',
    keys: [
      'MATERIAL_MARGIN_TIER1',
      'MATERIAL_MARGIN_TIER2',
      'MATERIAL_MARGIN_TIER3',
      'MATERIAL_MARGIN_TIER4',
    ],
  },
  {
    label: 'Administratif',
    description: 'Frais administratifs et marges internes',
    color: 'gray',
    emoji: '📁',
    keys: ['DOSSIER_FEE', 'MARGE_COMMERCIALE_PERCENT', 'MARGE_SOPANO_PERCENT'],
  },
  {
    label: 'Transport',
    description: 'Paramètres de calcul du transport GEODIS',
    color: 'sky',
    emoji: '🚚',
    keys: ['GEODIS_FUEL_SURCHARGE_PERCENT', 'TRANSPORT_MARGIN'],
  },
]

const COLOR_MAP: Record<string, {
  sidebar: string
  sidebarActive: string
  header: string
  border: string
  badge: string
  badgeText: string
  dot: string
  formulaBg: string
  formulaBgHover: string
  formulaBorder: string
  formulaText: string
}> = {
  purple: {
    sidebar: 'hover:bg-purple-50 hover:text-purple-700',
    sidebarActive: 'bg-purple-50 text-purple-700',
    header: 'bg-purple-50 border-b border-purple-100',
    border: 'border-purple-200',
    badge: 'bg-purple-100',
    badgeText: 'text-purple-700',
    dot: 'bg-purple-500',
    formulaBg: 'bg-purple-50',
    formulaBgHover: 'hover:bg-purple-50',
    formulaBorder: 'border-purple-100',
    formulaText: 'text-purple-800',
  },
  orange: {
    sidebar: 'hover:bg-orange-50 hover:text-orange-700',
    sidebarActive: 'bg-orange-50 text-orange-700',
    header: 'bg-orange-50 border-b border-orange-100',
    border: 'border-orange-200',
    badge: 'bg-orange-100',
    badgeText: 'text-orange-700',
    dot: 'bg-orange-500',
    formulaBg: 'bg-orange-50',
    formulaBgHover: 'hover:bg-orange-50',
    formulaBorder: 'border-orange-100',
    formulaText: 'text-orange-800',
  },
  pink: {
    sidebar: 'hover:bg-pink-50 hover:text-pink-700',
    sidebarActive: 'bg-pink-50 text-pink-700',
    header: 'bg-pink-50 border-b border-pink-100',
    border: 'border-pink-200',
    badge: 'bg-pink-100',
    badgeText: 'text-pink-700',
    dot: 'bg-pink-500',
    formulaBg: 'bg-pink-50',
    formulaBgHover: 'hover:bg-pink-50',
    formulaBorder: 'border-pink-100',
    formulaText: 'text-pink-800',
  },
  teal: {
    sidebar: 'hover:bg-teal-50 hover:text-teal-700',
    sidebarActive: 'bg-teal-50 text-teal-700',
    header: 'bg-teal-50 border-b border-teal-100',
    border: 'border-teal-200',
    badge: 'bg-teal-100',
    badgeText: 'text-teal-700',
    dot: 'bg-teal-500',
    formulaBg: 'bg-teal-50',
    formulaBgHover: 'hover:bg-teal-50',
    formulaBorder: 'border-teal-100',
    formulaText: 'text-teal-800',
  },
  blue: {
    sidebar: 'hover:bg-blue-50 hover:text-blue-700',
    sidebarActive: 'bg-blue-50 text-blue-700',
    header: 'bg-blue-50 border-b border-blue-100',
    border: 'border-blue-200',
    badge: 'bg-blue-100',
    badgeText: 'text-blue-700',
    dot: 'bg-blue-500',
    formulaBg: 'bg-blue-50',
    formulaBgHover: 'hover:bg-blue-50',
    formulaBorder: 'border-blue-100',
    formulaText: 'text-blue-800',
  },
  amber: {
    sidebar: 'hover:bg-amber-50 hover:text-amber-700',
    sidebarActive: 'bg-amber-50 text-amber-700',
    header: 'bg-amber-50 border-b border-amber-100',
    border: 'border-amber-200',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-700',
    dot: 'bg-amber-500',
    formulaBg: 'bg-amber-50',
    formulaBgHover: 'hover:bg-amber-50',
    formulaBorder: 'border-amber-100',
    formulaText: 'text-amber-800',
  },
  gray: {
    sidebar: 'hover:bg-slate-50 hover:text-slate-600',
    sidebarActive: 'bg-slate-50 text-slate-600',
    header: 'bg-slate-50 border-b border-slate-100',
    border: 'border-slate-200',
    badge: 'bg-slate-100',
    badgeText: 'text-slate-500',
    dot: 'bg-slate-400',
    formulaBg: 'bg-slate-50',
    formulaBgHover: 'hover:bg-slate-50',
    formulaBorder: 'border-slate-200',
    formulaText: 'text-slate-600',
  },
  sky: {
    sidebar: 'hover:bg-sky-50 hover:text-sky-700',
    sidebarActive: 'bg-sky-50 text-sky-700',
    header: 'bg-sky-50 border-b border-sky-100',
    border: 'border-sky-200',
    badge: 'bg-sky-100',
    badgeText: 'text-sky-700',
    dot: 'bg-sky-500',
    formulaBg: 'bg-sky-50',
    formulaBgHover: 'hover:bg-sky-50',
    formulaBorder: 'border-sky-100',
    formulaText: 'text-sky-800',
  },
}

type Colors = typeof COLOR_MAP[string]

function SettingRowContent({
  setting,
  formula,
  isExpanded,
  values,
  saving,
  activeColors,
  onToggleFormula,
  onValueChange,
  onSave,
}: {
  setting: { key: string; label: string; unit?: string | null }
  formula: { usedIn: string[]; formula: string; getExample: (v: Record<string, string>) => string } | undefined
  isExpanded: boolean
  values: Record<string, string>
  saving: string | null
  activeColors: Colors
  onToggleFormula: () => void
  onValueChange: (val: string) => void
  onSave: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-sm font-medium text-slate-700 block">{setting.label}</label>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {formula && (
            <Button
              size="sm"
              variant="ghost"
              className={`text-xs gap-1 h-8 px-2 ${activeColors.formulaText} ${activeColors.formulaBgHover}`}
              onClick={onToggleFormula}
            >
              <FlaskConical className="h-3 w-3" />
              {isExpanded ? 'Masquer' : 'Voir le calcul'}
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
          <Input
            type="number"
            step="any"
            value={values[setting.key] ?? ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-28 text-right"
          />
          {setting.unit && (
            <span className="text-sm text-slate-500 w-14 shrink-0">{setting.unit}</span>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={onSave}
            disabled={saving === setting.key}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {formula && isExpanded && (
        <div className={`mt-3 rounded-lg border ${activeColors.formulaBorder} ${activeColors.formulaBg} p-4 space-y-3`}>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Utilisé dans</p>
            <div className="flex flex-wrap gap-1.5">
              {formula.usedIn.map((usage) => (
                <span key={usage} className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeColors.badge} ${activeColors.badgeText}`}>
                  {usage}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Formule</p>
            <code className={`text-xs font-mono block bg-white/70 rounded px-3 py-2 border ${activeColors.formulaBorder} ${activeColors.formulaText}`}>
              {formula.formula}
            </code>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Exemple chiffré</p>
            <code className={`text-xs font-mono block bg-white/70 rounded px-3 py-2 border ${activeColors.formulaBorder} ${activeColors.formulaText}`}>
              {formula.getExample(values)}
            </code>
          </div>
        </div>
      )}
    </>
  )
}

export function SettingsClient({
  settings,
  packagingData,
}: {
  settings: Setting[]
  packagingData?: { rules: PackagingRuleForAdmin[]; coefficients: QuantityCoefficientForAdmin[] }
}) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].label)
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedFormulas, setExpandedFormulas] = useState<Record<string, boolean>>({})

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s]))

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await updateSetting(key, values[key])
      toast.success('Paramètre mis à jour !')
    } catch (e) {
      toast.error('Erreur lors de la mise à jour')
      console.error(e)
    } finally {
      setSaving(null)
    }
  }

  const toggleFormula = (key: string) => {
    setExpandedFormulas((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCategoryChange = (label: string) => {
    setActiveCategory(label)
    setActiveSubcategory(null)
  }

  const activeConfig = CATEGORIES.find((c) => c.label === activeCategory)!
  const activeColors = COLOR_MAP[activeConfig.color]

  const activeSub = activeConfig.subcategories
    ? (activeSubcategory
        ? activeConfig.subcategories.find((s) => s.label === activeSubcategory)
        : activeConfig.subcategories[0])
    : null

  const allKeys = activeConfig.subcategories
    ? activeConfig.subcategories.flatMap((s) => s.keys)
    : (activeConfig.keys ?? [])

  const categorySettings = activeSub
    ? activeSub.keys.map((key) => settingsMap[key]).filter(Boolean)
    : allKeys.map((key) => settingsMap[key]).filter(Boolean)

  return (
    <div className="flex gap-6 pb-8">

      {/* ── Sidebar ── */}
      <div className="w-52 shrink-0">
        <Card className="overflow-hidden sticky top-6">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 px-4">
            <CardTitle className="text-sm text-slate-600">Catégories</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const colors = COLOR_MAP[cat.color]
                const isActive = activeCategory === cat.label
                const catKeys = cat.subcategories ? cat.subcategories.flatMap((s) => s.keys) : (cat.keys ?? [])
                const catSettings = catKeys.map((k) => settingsMap[k]).filter(Boolean)

                return (
                  <button
                    key={cat.label}
                    onClick={() => handleCategoryChange(cat.label)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                      flex items-center justify-between gap-2
                      ${isActive
                        ? `${colors.sidebarActive} font-medium`
                        : `text-slate-600 ${colors.sidebar}`
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? colors.dot : 'bg-transparent'}`} />
                      <span className="truncate">{cat.emoji} {cat.label}</span>
                    </div>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full shrink-0
                      ${isActive ? `${colors.badge} ${colors.badgeText}` : 'bg-slate-100 text-slate-400'}
                    `}>
                      {catSettings.length}
                    </span>
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 min-w-0">
        <Card className={`border ${activeColors.border} overflow-hidden`}>
          <CardHeader className={`${activeColors.header} py-4 px-6`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{activeConfig.emoji}</span>

                  {activeConfig.label}
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {activeConfig.description}
                </CardDescription>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${activeColors.badge} ${activeColors.badgeText}`}>
                {categorySettings.length} paramètre{categorySettings.length > 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>

          {activeConfig.subcategories && (
            <div className={`flex gap-1 px-6 pt-4 border-b ${activeColors.border}`}>
              {activeConfig.subcategories.map((sub) => {
                const isActiveSub = (activeSub?.label ?? activeConfig.subcategories![0].label) === sub.label
                return (
                  <button
                    key={sub.label}
                    onClick={() => setActiveSubcategory(sub.label)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                      isActiveSub
                        ? `${activeColors.badgeText} border-current bg-white`
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                  >
                    {sub.label}
                  </button>
                )
              })}
            </div>
          )}

          <CardContent className="px-6 py-4 space-y-4">

            {(
              categorySettings.map((setting, index) => {
                const formula = FORMULAS[setting.key]
                const isExpanded = expandedFormulas[setting.key]
                return (
                  <div key={setting.key} className={index < categorySettings.length - 1 ? 'pb-4 border-b border-slate-100' : ''}>
                    <SettingRowContent
                      setting={setting}
                      formula={formula}
                      isExpanded={!!isExpanded}
                      values={values}
                      saving={saving}
                      activeColors={activeColors}
                      onToggleFormula={() => toggleFormula(setting.key)}
                      onValueChange={(val) => setValues((prev) => ({ ...prev, [setting.key]: val }))}
                      onSave={() => handleSave(setting.key)}
                    />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {activeConfig.label === 'Emballage' && packagingData && (
          <div className="mt-4">
            <PackagingPricingClient
              initialRules={packagingData.rules}
              initialCoefficients={packagingData.coefficients}
            />
          </div>
        )}
      </div>
    </div>
  )
}