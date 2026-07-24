-- Frais fixes automatiques (CDC section 3) : fournitures emballage + option palette
-- Défaut false : les devis existants ne changent pas ; les nouveaux devis activent via QUOTE_DEFAULTS
ALTER TABLE "Quote" ADD COLUMN "hasFournituresEmb" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quote" ADD COLUMN "hasPalette" BOOLEAN NOT NULL DEFAULT false;
