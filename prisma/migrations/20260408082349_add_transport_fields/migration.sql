-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "transportBasePrice" DOUBLE PRECISION,
ADD COLUMN     "transportDepartment" TEXT,
ADD COLUMN     "transportMode" TEXT,
ADD COLUMN     "transportOptions" DOUBLE PRECISION,
ADD COLUMN     "transportTotal" DOUBLE PRECISION,
ADD COLUMN     "transportUnits" INTEGER,
ADD COLUMN     "transportWeight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "TransportShipment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientName" TEXT NOT NULL,
    "plvType" TEXT NOT NULL,
    "plvFormat" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "transportMode" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "units" INTEGER NOT NULL,
    "basePriceHT" DOUBLE PRECISION NOT NULL,
    "optionsHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHT" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "quoteId" INTEGER,

    CONSTRAINT "TransportShipment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransportShipment" ADD CONSTRAINT "TransportShipment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
