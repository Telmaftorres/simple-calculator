-- Mode Prototype (CDC) : forfait BE+dossier bloqué à 25 €, fournitures réduites à 10 €
-- Défaut false : les devis existants ne changent pas
ALTER TABLE "Quote" ADD COLUMN "modePrototype" BOOLEAN NOT NULL DEFAULT false;
