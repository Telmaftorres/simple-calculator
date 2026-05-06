-- CreateTable
CREATE TABLE "ProductTemplateOptionConfig" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL,
    "defaultQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductTemplateOptionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTemplateOptionConfig_templateId_optionId_key" ON "ProductTemplateOptionConfig"("templateId", "optionId");

-- AddForeignKey
ALTER TABLE "ProductTemplateOptionConfig" ADD CONSTRAINT "ProductTemplateOptionConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateOptionConfig" ADD CONSTRAINT "ProductTemplateOptionConfig_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
