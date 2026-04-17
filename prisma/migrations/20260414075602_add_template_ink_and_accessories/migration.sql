-- AlterTable
ALTER TABLE "ProductTemplate" ADD COLUMN     "flatColorSurfacePercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inkMlPerPlate" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "inkMlVerso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "varnishSurfacePercent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductTemplateAccessory" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "accessoryId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductTemplateAccessory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductTemplateAccessory" ADD CONSTRAINT "ProductTemplateAccessory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateAccessory" ADD CONSTRAINT "ProductTemplateAccessory_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "Accessory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
