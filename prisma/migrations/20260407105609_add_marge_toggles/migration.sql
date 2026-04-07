-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "showMargeCommerciale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showMargeSopano" BOOLEAN NOT NULL DEFAULT false;
