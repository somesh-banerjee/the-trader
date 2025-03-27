-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('NSE', 'BSE', 'MCX', 'NCD', 'BCD');

-- CreateEnum
CREATE TYPE "Segment" AS ENUM ('EQ', 'FO', 'INDEX', 'COM');

-- CreateTable
CREATE TABLE "instrument" (
    "id" SERIAL NOT NULL,
    "exchange" "Exchange" NOT NULL,
    "segment" "Segment" NOT NULL,
    "symbol" TEXT NOT NULL,
    "trade_enabled" BOOLEAN NOT NULL DEFAULT false,
    "upstox_key" TEXT,
    "zerodha_key" TEXT,
    "angelone_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instrument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instrument_exchange_segment_symbol_key" ON "instrument"("exchange", "segment", "symbol");
