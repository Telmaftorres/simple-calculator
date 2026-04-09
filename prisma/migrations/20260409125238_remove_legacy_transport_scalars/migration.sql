/*
  Warnings:

  - You are about to drop the column `transportBasePrice` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `transportDepartment` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `transportMode` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `transportOptions` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `transportUnits` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `transportWeight` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "transportBasePrice",
DROP COLUMN "transportDepartment",
DROP COLUMN "transportMode",
DROP COLUMN "transportOptions",
DROP COLUMN "transportUnits",
DROP COLUMN "transportWeight";
