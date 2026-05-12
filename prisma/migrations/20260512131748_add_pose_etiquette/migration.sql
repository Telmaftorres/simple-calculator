-- AlterTable
ALTER TABLE "ProductTemplate" ADD COLUMN     "hasPoseEtiquette" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "hasPoseEtiquette" BOOLEAN NOT NULL DEFAULT false;
