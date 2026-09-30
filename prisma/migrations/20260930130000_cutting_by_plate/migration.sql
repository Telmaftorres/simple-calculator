-- Découpe produit principal : par pose (existant) ou par plaque entière (nouveau)
ALTER TABLE "Quote" ADD COLUMN "cuttingByPlate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quote" ADD COLUMN "cuttingTimePerPlateSeconds" INTEGER NOT NULL DEFAULT 0;
