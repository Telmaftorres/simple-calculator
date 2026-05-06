-- AlterTable
ALTER TABLE "ProductTemplateElement" ADD COLUMN     "cuttingSetupType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "cuttingTimePerPoseSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flatColorSurfacePercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasFlatColor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasImpression" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasVarnish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inkMlPerPlate" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "inkMlVerso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isRectoVerso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printMode" TEXT NOT NULL DEFAULT 'production',
ADD COLUMN     "printSetupType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "rectoVersoType" TEXT,
ADD COLUMN     "varnishSurfacePercent" INTEGER NOT NULL DEFAULT 0;
