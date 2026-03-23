-- Renommer printSurface → inkMlPerPlate
ALTER TABLE "Quote" RENAME COLUMN "printSurface" TO "inkMlPerPlate";

-- Ajouter les colonnes finitions
ALTER TABLE "Quote" ADD COLUMN "varnishSurfacePercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "flatColorSurfacePercent" INTEGER NOT NULL DEFAULT 0;

-- Nouvelle constante métier
INSERT INTO "Setting" ("key", "value", "label", "unit", "createdAt", "updatedAt")
VALUES ('INK_COST_FINISHING_PER_LITER', '120', 'Coût encre finition (vernis/aplat)', '€/L', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
