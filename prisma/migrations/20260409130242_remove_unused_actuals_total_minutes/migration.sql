/*
  Warnings:

  - You are about to drop the column `actualAssemblyTotalMinutes` on the `QuoteActuals` table. All the data in the column will be lost.
  - You are about to drop the column `actualCuttingTotalMinutes` on the `QuoteActuals` table. All the data in the column will be lost.
  - You are about to drop the column `actualPackTotalMinutes` on the `QuoteActuals` table. All the data in the column will be lost.
  - You are about to drop the column `actualPrintTotalMinutes` on the `QuoteActuals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuoteActuals" DROP COLUMN "actualAssemblyTotalMinutes",
DROP COLUMN "actualCuttingTotalMinutes",
DROP COLUMN "actualPackTotalMinutes",
DROP COLUMN "actualPrintTotalMinutes";
