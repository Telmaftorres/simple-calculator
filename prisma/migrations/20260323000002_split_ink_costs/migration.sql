-- Renommer INK_COST_FINISHING_PER_LITER → INK_COST_VARNISH_PER_LITER
UPDATE "Setting" SET key = 'INK_COST_VARNISH_PER_LITER', label = 'Coût encre vernis', "updatedAt" = NOW()
WHERE key = 'INK_COST_FINISHING_PER_LITER';

-- Ajouter INK_COST_FLAT_COLOR_PER_LITER
INSERT INTO "Setting" ("key", "value", "label", "unit", "createdAt", "updatedAt")
VALUES ('INK_COST_FLAT_COLOR_PER_LITER', '120', 'Coût encre aplat', '€/L', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;

-- Supprimer INK_BASE_ML_PER_PLATE
DELETE FROM "Setting" WHERE key = 'INK_BASE_ML_PER_PLATE';