-- CreateTable
CREATE TABLE "ProductTemplateElement" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "elementId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductTemplateElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTemplateVariantConfig" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "defaultQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductTemplateVariantConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTemplateElement_templateId_elementId_key" ON "ProductTemplateElement"("templateId", "elementId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTemplateVariantConfig_templateId_variantId_key" ON "ProductTemplateVariantConfig"("templateId", "variantId");

-- AddForeignKey
ALTER TABLE "ProductTemplateElement" ADD CONSTRAINT "ProductTemplateElement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateElement" ADD CONSTRAINT "ProductTemplateElement_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateVariantConfig" ADD CONSTRAINT "ProductTemplateVariantConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateVariantConfig" ADD CONSTRAINT "ProductTemplateVariantConfig_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductOptionVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
