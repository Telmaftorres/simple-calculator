-- CreateTable
CREATE TABLE IF NOT EXISTS "Consumable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuoteConsumable" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "consumableId" INTEGER NOT NULL,
    "sizePerItem" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "QuoteConsumable_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuoteConsumable" ADD CONSTRAINT "QuoteConsumable_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteConsumable" ADD CONSTRAINT "QuoteConsumable_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;