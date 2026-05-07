-- AlterTable
ALTER TABLE "ProductionSheet" ADD COLUMN     "prodMachineTimeMinOverride" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "machineTimeMinOverride" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "QuoteActuals" ADD COLUMN     "actualMachineTimeMinOverride" DOUBLE PRECISION;
