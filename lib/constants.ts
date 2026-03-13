/**
 * Constantes métier du calculateur PLV.
 * Centralise toutes les valeurs "magic numbers" utilisées dans les calculs de coûts.
 */

// ── Taux horaires ──
/** Taux horaire impression et découpe (€/h) */
export const HOURLY_RATE_PRINT = 65

/** Taux horaire façonnage et conditionnement (€/h) */
export const HOURLY_RATE_ASSEMBLY = 45

// ── Impression ──
/** Coût de l'encre (€/litre) */
export const INK_COST_PER_LITER = 40

/** Volume d'encre de base par plaque (ml) */
export const INK_BASE_ML_PER_PLATE = 20

/** Temps de calage impression (min) */
export const PRINT_SETUP_TIME_MIN = 15

// ── Découpe ──
/** Temps de calage découpe (secondes) = 15 min */
export const CUTTING_SETUP_SECONDS = 900

// ── Finitions ──
/** Supplément encre par option activée (vernis, aplat) */
export const FINISHING_SURCHARGE_PERCENT = 0.05

// ── Conditionnement ──
/** Coût notice de montage par pièce (€) */
export const ASSEMBLY_NOTICE_COST_PER_PIECE = 0.10
