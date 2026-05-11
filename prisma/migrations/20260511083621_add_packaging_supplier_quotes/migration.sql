-- CreateTable
CREATE TABLE "PackagingSupplierQuote" (
    "id" SERIAL NOT NULL,
    "supplierName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingSupplierQuote_pkey" PRIMARY KEY ("id")
);
