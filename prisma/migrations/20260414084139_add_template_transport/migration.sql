-- AlterTable
ALTER TABLE "ProductTemplate" ADD COLUMN     "defaultTransportMode" TEXT,
ADD COLUMN     "hasTransport" BOOLEAN NOT NULL DEFAULT false;
