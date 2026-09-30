-- Nombre de palettes pour l'option transport (remplace le simple Oui/Non)
ALTER TABLE "Quote" ADD COLUMN "paletteQuantity" INTEGER NOT NULL DEFAULT 1;
