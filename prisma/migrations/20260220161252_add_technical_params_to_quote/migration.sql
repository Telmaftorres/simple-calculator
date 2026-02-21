/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "assemblyTimePerPieceSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cuttingTimePerPoseSeconds" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "hasAssemblyNotice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFlatColor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasVarnish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRectoVerso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packTimePerPieceSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "printMode" TEXT NOT NULL DEFAULT 'production',
ADD COLUMN     "rectoVersoType" TEXT,
ADD COLUMN     "reference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_reference_key" ON "Quote"("reference");
