// ── Calage (forfaits fixes) ──
export const PRINT_SETUP_STANDARD_COST = 15
export const PRINT_SETUP_COMPLEX_COST = 25
export const CUTTING_SETUP_STANDARD_COST = 15
export const CUTTING_SETUP_COMPLEX_COST = 25

// ── Taux horaires coûtants (coût de revient réel, hors marge) ──
// Estimations de départ à affiner : MO chargée + coût machine, sans marge.
export const HOURLY_RATE_PRINT_COST = 40
export const HOURLY_RATE_CUTTING_COST = 36
export const HOURLY_RATE_ASSEMBLY_COST = 31
export const HOURLY_RATE_CONDITIONING_COST = 27
export const HOURLY_RATE_PACKAGING_COST = 32
export const HOURLY_RATE_BE_COST = 45
export const HOURLY_RATE_BAT_COST = 42

// ── Impression ──
export const HOURLY_RATE_PRINT = 50
export const PRINT_SETUP_TIME_MIN = 15
export const PRINT_SPEED_PRODUCTION = 1
export const PRINT_SPEED_QUALITY = 2
export const PRINT_SPEED_VARNISH = 1.5
export const PRINT_SPEED_FLAT_COLOR = 1.5
export const INK_COST_PER_LITER = 95
export const INK_COST_VARNISH_PER_LITER = 120
export const INK_COST_FLAT_COLOR_PER_LITER = 120

// ── Découpe ──
export const HOURLY_RATE_CUTTING = 50
export const CUTTING_SETUP_MINUTES = 15

// ── Façonnage ──
export const HOURLY_RATE_ASSEMBLY = 40

// ── Conditionnement ──
export const HOURLY_RATE_CONDITIONING = 40
export const ASSEMBLY_NOTICE_COST_PER_PIECE = 0.10
export const POSE_ETIQUETTE_COST_PER_PIECE = 0.10

// ── Imposition ──
export const POSE_SPACING_MM = 10
export const PLATE_BORDER_MM = 10   // marge de bord de plaque, chaque côté (mm)

// ── Emballage ──
export const HOURLY_RATE_PACKAGING = 40
export const PACKAGING_SETUP_COST = 10

// ── Bureau d'etudes ──
export const HOURLY_RATE_BE = 90
export const HOURLY_RATE_BAT = 70

// ── Marges encre (coefficient de sécurité CDC V1.0 : x3,5) ──
// Standard 95 €/L × 3,5 = 332,50 €/L · Vernis/Blanc 120 €/L × 3,5 = 420 €/L
export const INK_MARGIN_STANDARD = 3.5
export const INK_MARGIN_VARNISH = 3.5
export const INK_MARGIN_FLAT_COLOR = 3.5

// ── Marges materiel (ancien barème 4 paliers — encore utilisé pour l'emballage) ──
export const MATERIAL_MARGIN_TIER1 = 3.5
export const MATERIAL_MARGIN_TIER2 = 3
export const MATERIAL_MARGIN_TIER3 = 2.5
export const MATERIAL_MARGIN_TIER4 = 2

// ── Matrice matière (cahier des charges V1.0) : coeff = f(prix €/m² de la matière, quantité TOTALE du devis) ──
// Lignes = paliers de quantité  · Q1 = 1-5 ex · Q2 = 6-50 · Q3 = 51-200 · Q4 = >201
// Colonnes = paliers de prix/m² · P1 = ≤8€ · P2 = 8,01-20€ · P3 = ≥20,01€
export const MATERIAL_MARGIN_Q1_P1 = 3.5
export const MATERIAL_MARGIN_Q1_P2 = 2.8
export const MATERIAL_MARGIN_Q1_P3 = 2.2
export const MATERIAL_MARGIN_Q2_P1 = 3.0
export const MATERIAL_MARGIN_Q2_P2 = 2.5
export const MATERIAL_MARGIN_Q2_P3 = 2.0
export const MATERIAL_MARGIN_Q3_P1 = 2.6
export const MATERIAL_MARGIN_Q3_P2 = 2.2
export const MATERIAL_MARGIN_Q3_P3 = 1.8
export const MATERIAL_MARGIN_Q4_P1 = 2.2
export const MATERIAL_MARGIN_Q4_P2 = 1.8
export const MATERIAL_MARGIN_Q4_P3 = 1.5

export const DOSSIER_FEE = 15

// ── Marges internes (lecture seule, jamais sauvegardees en DB) ──
export const MARGE_COMMERCIALE_PERCENT = 2.5
export const MARGE_SOPANO_PERCENT = 5

// ── Transport GEODIS ──
export const GEODIS_FUEL_SURCHARGE_PERCENT = 2.9
export const TRANSPORT_MARGIN = 1.4

// ── Emballage B/EB (fournisseur externe, prix unitaire €/pce) ──
// À configurer dans les paramètres (valeurs 0 = non configuré)
export const PACKAGING_B_PETIT_PRICE = 0
export const PACKAGING_B_MOYEN_PRICE = 0
export const PACKAGING_B_GRAND_PRICE = 0
export const PACKAGING_EB_PETIT_PRICE = 0
export const PACKAGING_EB_MOYEN_PRICE = 0
export const PACKAGING_EB_GRAND_PRICE = 0
