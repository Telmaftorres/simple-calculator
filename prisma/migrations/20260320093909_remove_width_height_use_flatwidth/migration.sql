/*
  Warnings:

  - You are about to drop the column `height` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Quote` table. All the data in the column will be lost.
  - Made the column `flatWidth` on table `Quote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `flatHeight` on table `Quote` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "height",
DROP COLUMN "width",
ALTER COLUMN "flatWidth" SET NOT NULL,
ALTER COLUMN "flatHeight" SET NOT NULL;
