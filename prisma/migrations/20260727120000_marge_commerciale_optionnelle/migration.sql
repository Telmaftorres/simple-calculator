-- Marge commerciale (2,5 %) optionnelle : décochable quand le patron trouve le client
-- Défaut true : la commission commerciale s'applique par défaut (comportement inchangé)
ALTER TABLE "Quote" ADD COLUMN "hasMargeCommerciale" BOOLEAN NOT NULL DEFAULT true;
