-- AlterTable
ALTER TABLE "ProductTemplate" ADD COLUMN     "flatDepth" INTEGER,
ADD COLUMN     "formatType" TEXT NOT NULL DEFAULT '2d';
