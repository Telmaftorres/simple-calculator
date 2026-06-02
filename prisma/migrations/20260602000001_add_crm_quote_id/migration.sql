-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "crmQuoteId" TEXT,
ADD COLUMN "crmSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_crmQuoteId_key" ON "Quote"("crmQuoteId");
