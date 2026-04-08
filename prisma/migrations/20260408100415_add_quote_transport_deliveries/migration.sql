-- CreateTable
CREATE TABLE "QuoteTransportDelivery" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "transportMode" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "units" INTEGER NOT NULL DEFAULT 1,
    "optionsHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basePriceHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHT" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteTransportDelivery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuoteTransportDelivery" ADD CONSTRAINT "QuoteTransportDelivery_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
