-- Découpe emballage : par pose (existant) ou par plaque entière (nouveau)
ALTER TABLE "Quote" ADD COLUMN "packagingCuttingByPlate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quote" ADD COLUMN "packagingCuttingTimePerPlateSeconds" INTEGER NOT NULL DEFAULT 0;
