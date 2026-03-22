/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Consumable` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Consumable` table. All the data in the column will be lost.
  - You are about to drop the column `assemblySeconds` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `cuttingMinutes` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `packSeconds` on the `Quote` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuoteAccessory" DROP CONSTRAINT "QuoteAccessory_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteConsumable" DROP CONSTRAINT "QuoteConsumable_consumableId_fkey";

-- AlterTable
ALTER TABLE "Consumable" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "assemblySeconds",
DROP COLUMN "cuttingMinutes",
DROP COLUMN "packSeconds",
ADD COLUMN     "hasAccessoires" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasConditionnement" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasCuttingSetup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasFaconnage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasImpression" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasPrintSetup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "packagingHeight" INTEGER,
ADD COLUMN     "packagingWidth" INTEGER,
ALTER COLUMN "cuttingTimePerPoseSeconds" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Setting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_packagingPlateId_fkey" FOREIGN KEY ("packagingPlateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteConsumable" ADD CONSTRAINT "QuoteConsumable_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAccessory" ADD CONSTRAINT "QuoteAccessory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
