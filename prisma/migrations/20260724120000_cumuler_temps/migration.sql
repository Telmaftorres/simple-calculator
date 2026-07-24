-- Flag « cumuler les temps » (temps masqué impression + découpe) sur le devis
ALTER TABLE "Quote" ADD COLUMN "cumulerTemps" BOOLEAN NOT NULL DEFAULT false;
