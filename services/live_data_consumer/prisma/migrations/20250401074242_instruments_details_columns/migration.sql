/*
  Warnings:

  - Added the required column `isin` to the `instrument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `instrument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "instrument" ADD COLUMN     "isin" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "short_name" TEXT;
