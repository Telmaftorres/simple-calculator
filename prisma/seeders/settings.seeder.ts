import { PrismaClient } from '@prisma/client'
import {
  HOURLY_RATE_PRINT,
  HOURLY_RATE_ASSEMBLY,
  HOURLY_RATE_PACKAGING,
  INK_COST_PER_LITER,
  INK_COST_VARNISH_PER_LITER,
  INK_COST_FLAT_COLOR_PER_LITER,
  PRINT_SETUP_TIME_MIN,
  PRINT_SPEED_PRODUCTION,
  PRINT_SPEED_QUALITY,
  PRINT_SPEED_VARNISH,
  PRINT_SPEED_FLAT_COLOR,
  CUTTING_SETUP_MINUTES,
  PRINT_SETUP_STANDARD_COST,
  PRINT_SETUP_COMPLEX_COST,
  CUTTING_SETUP_STANDARD_COST,
  CUTTING_SETUP_COMPLEX_COST,
  ASSEMBLY_NOTICE_COST_PER_PIECE,
  POSE_SPACING_MM,
  PACKAGING_SETUP_COST,
  HOURLY_RATE_BAT,
  HOURLY_RATE_BE,
  HOURLY_RATE_CUTTING,
  MATERIAL_MARGIN_TIER1,
  MATERIAL_MARGIN_TIER2,
  MATERIAL_MARGIN_TIER3,
  MATERIAL_MARGIN_TIER4,
  DOSSIER_FEE,
  HOURLY_RATE_CONDITIONING,
  MARGE_COMMERCIALE_PERCENT,
  MARGE_SOPANO_PERCENT,
} from '../../lib/constants'

export async function seedSettings(prisma: PrismaClient): Promise<void> {
  console.log('⚙️ Seeding settings...')
  const settings = [
    { key: 'HOURLY_RATE_PRINT', value: String(HOURLY_RATE_PRINT), label: 'Taux horaire impression', unit: '€/h' },
    { key: 'PRINT_SETUP_TIME_MIN', value: String(PRINT_SETUP_TIME_MIN), label: 'Calage impression', unit: 'min' },
    { key: 'PRINT_SPEED_PRODUCTION', value: String(PRINT_SPEED_PRODUCTION), label: 'Temps impression production', unit: 'min/m²' },
    { key: 'PRINT_SPEED_QUALITY', value: String(PRINT_SPEED_QUALITY), label: 'Temps impression qualité', unit: 'min/m²' },
    { key: 'PRINT_SPEED_VARNISH', value: String(PRINT_SPEED_VARNISH), label: 'Temps impression vernis', unit: 'min/m²' },
    { key: 'PRINT_SPEED_FLAT_COLOR', value: String(PRINT_SPEED_FLAT_COLOR), label: 'Temps impression blanc', unit: 'min/m²' },
    { key: 'INK_COST_PER_LITER', value: String(INK_COST_PER_LITER), label: "Coût de l'encre standard", unit: '€/L' },
    { key: 'INK_COST_VARNISH_PER_LITER', value: String(INK_COST_VARNISH_PER_LITER), label: 'Coût encre vernis', unit: '€/L' },
    { key: 'INK_COST_FLAT_COLOR_PER_LITER', value: String(INK_COST_FLAT_COLOR_PER_LITER), label: 'Coût encre blanc', unit: '€/L' },
    { key: 'HOURLY_RATE_CUTTING', value: String(HOURLY_RATE_CUTTING), label: 'Taux horaire découpe', unit: '€/h' },
    { key: 'PRINT_SETUP_STANDARD_COST', value: String(PRINT_SETUP_STANDARD_COST), label: 'Calage impression standard', unit: '€' },
    { key: 'PRINT_SETUP_COMPLEX_COST', value: String(PRINT_SETUP_COMPLEX_COST), label: 'Calage impression complexe', unit: '€' },
    { key: 'CUTTING_SETUP_STANDARD_COST', value: String(CUTTING_SETUP_STANDARD_COST), label: 'Calage découpe standard', unit: '€' },
    { key: 'CUTTING_SETUP_COMPLEX_COST', value: String(CUTTING_SETUP_COMPLEX_COST), label: 'Calage découpe complexe', unit: '€' },
    { key: 'CUTTING_SETUP_MINUTES', value: String(CUTTING_SETUP_MINUTES), label: 'Calage découpe', unit: 'min' },
    { key: 'HOURLY_RATE_ASSEMBLY', value: String(HOURLY_RATE_ASSEMBLY), label: 'Taux horaire façonnage', unit: '€/h' },
    { key: 'HOURLY_RATE_CONDITIONING', value: String(HOURLY_RATE_CONDITIONING), label: 'Taux horaire conditionnement', unit: '€/h' },
    { key: 'ASSEMBLY_NOTICE_COST_PER_PIECE', value: String(ASSEMBLY_NOTICE_COST_PER_PIECE), label: 'Coût notice de montage', unit: '€/pce' },
    { key: 'POSE_SPACING_MM', value: String(POSE_SPACING_MM), label: 'Espacement entre poses', unit: 'mm' },
    { key: 'HOURLY_RATE_PACKAGING', value: String(HOURLY_RATE_PACKAGING), label: 'Taux horaire emballage', unit: '€/h' },
    { key: 'PACKAGING_SETUP_COST', value: String(PACKAGING_SETUP_COST), label: 'Calage emballage', unit: '€' },
    { key: 'HOURLY_RATE_BE', value: String(HOURLY_RATE_BE), label: 'Taux horaire Bureau d\'études', unit: '€/h' },
    { key: 'HOURLY_RATE_BAT', value: String(HOURLY_RATE_BAT), label: 'Taux horaire BAT', unit: '€/h' },
    { key: 'MATERIAL_MARGIN_TIER1', value: String(MATERIAL_MARGIN_TIER1), label: 'Coefficient matière < 5 €/m²', unit: 'x' },
    { key: 'MATERIAL_MARGIN_TIER2', value: String(MATERIAL_MARGIN_TIER2), label: 'Coefficient matière 5-10 €/m²', unit: 'x' },
    { key: 'MATERIAL_MARGIN_TIER3', value: String(MATERIAL_MARGIN_TIER3), label: 'Coefficient matière 10-20 €/m²', unit: 'x' },
    { key: 'MATERIAL_MARGIN_TIER4', value: String(MATERIAL_MARGIN_TIER4), label: 'Coefficient matière > 20 €/m²', unit: 'x' },
    { key: 'DOSSIER_FEE', value: String(DOSSIER_FEE), label: 'Frais de dossier', unit: '€' },
    { key: 'MARGE_COMMERCIALE_PERCENT', value: String(MARGE_COMMERCIALE_PERCENT), label: 'Com. commerciale', unit: '%' },
    { key: 'MARGE_SOPANO_PERCENT', value: String(MARGE_SOPANO_PERCENT), label: 'Com. Sopano', unit: '%' },
    { key: 'GEODIS_FUEL_SURCHARGE_PERCENT', value: '2.9', label: 'Surcharge carburant GEODIS', unit: '%' },
  ]

  const obsoleteKeys = [
    'INK_BASE_ML_PER_PLATE',
    'INK_COST_FINISHING_PER_LITER',
    'FINISHING_SURCHARGE_PERCENT',
    'MARGIN_IMPRESSION',
    'MARGIN_DECOUPE',
    'MARGIN_FACONNAGE',
    'MARGIN_CONDITIONNEMENT',
    'MARGIN_MATERIAUX',
    'MARGIN_EMBALLAGE',
  ]
  await prisma.setting.deleteMany({ where: { key: { in: obsoleteKeys } } })
  console.log('Anciennes constantes supprimées :', obsoleteKeys)

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { label: setting.label, unit: setting.unit },
      create: setting,
    })
  }
  console.log('✅ Settings seed: terminé.')
}
