-- Mode Kit : le nombre de kits remplace la quantité de PLV pour notice/étiquette/emballage
ALTER TABLE "Quote" ADD COLUMN "hasKitMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quote" ADD COLUMN "kitQuantity" INTEGER NOT NULL DEFAULT 0;
