-- Encre : coefficient de sécurité aligné sur le CDC V1.0 (x3,5)
-- Garde-fou : on ne met à jour que les lignes restées au défaut (pour ne pas écraser une valeur custom)
-- Standard : 4,5 -> 3,5  (95 €/L × 3,5 = 332,50 €/L)
UPDATE "Setting" SET value = '3.5' WHERE key = 'INK_MARGIN_STANDARD' AND value = '4.5';
-- Vernis : 7 -> 3,5  (120 €/L × 3,5 = 420 €/L)
UPDATE "Setting" SET value = '3.5' WHERE key = 'INK_MARGIN_VARNISH' AND value = '7';
-- Blanc : 7 -> 3,5  (120 €/L × 3,5 = 420 €/L)
UPDATE "Setting" SET value = '3.5' WHERE key = 'INK_MARGIN_FLAT_COLOR' AND value = '7';
