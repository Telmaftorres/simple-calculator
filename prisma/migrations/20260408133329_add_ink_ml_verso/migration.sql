-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "inkMlVerso" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "QuoteProduct" ADD COLUMN     "inkMlVerso" INTEGER NOT NULL DEFAULT 0;
