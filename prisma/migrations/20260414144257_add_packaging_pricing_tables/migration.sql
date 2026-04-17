-- CreateTable
CREATE TABLE "PackagingPricingRule" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "baseUnitPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityCoefficient" (
    "id" SERIAL NOT NULL,
    "quantityBand" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "coefficient" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuantityCoefficient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackagingPricingRule_category_material_size_key" ON "PackagingPricingRule"("category", "material", "size");

-- CreateIndex
CREATE UNIQUE INDEX "QuantityCoefficient_quantityBand_key" ON "QuantityCoefficient"("quantityBand");
