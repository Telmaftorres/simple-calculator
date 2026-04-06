/*
  Warnings:

  - You are about to drop the column `hasCuttingSetup` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `hasPrintSetup` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "hasCuttingSetup",
DROP COLUMN "hasPrintSetup",
ADD COLUMN     "cuttingSetupType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "printSetupType" TEXT NOT NULL DEFAULT 'none';
