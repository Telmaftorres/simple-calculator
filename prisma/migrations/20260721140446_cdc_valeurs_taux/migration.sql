-- Alignement sur le cahier des charges V1.0 (garde-fou : on ne change que les valeurs restées au défaut)
-- Façonnage vente : 45 -> 40
UPDATE "Setting" SET value = '40' WHERE key = 'HOURLY_RATE_ASSEMBLY' AND value = '45';
-- Emballage vente : 45 -> 40
UPDATE "Setting" SET value = '40' WHERE key = 'HOURLY_RATE_PACKAGING' AND value = '45';
-- Frais de dossier : 8 -> 15
UPDATE "Setting" SET value = '15' WHERE key = 'DOSSIER_FEE' AND value = '8';
