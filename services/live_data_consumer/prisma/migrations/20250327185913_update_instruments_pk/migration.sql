/*
  Warnings:

  - The primary key for the `instrument` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "instrument" DROP CONSTRAINT "instrument_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "instrument_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "instrument_id_seq";
