import { Strategy, StrategySignal } from './base.strategy';
import { CandleData } from '../../raw-tick-consumer/raw-tick-consumer.service';
import { randomUUID } from 'crypto';

export class EmaCrossoverStrategy implements Strategy {
  name = 'EMA_CROSSOVER';
  version = 1;
  strategyId = 'EMA_9_21_1M'; // config-specific id

  private calculateSMA(period: number, candles: CandleData[]): number {
    const recent = candles.slice(-period);
    const sum = recent.reduce((acc, c) => acc + c.close.toNumber(), 0);
    return sum / period;
  }

  evaluate(
    instrumentId: string,
    timeframe: string,
    candles: CandleData[],
  ): StrategySignal | null {
    if (candles.length < 21) return null;

    const short = this.calculateSMA(9, candles);
    const long = this.calculateSMA(21, candles);

    const lastCandle = candles[candles.length - 1];
    const lastClose = lastCandle.close.toNumber();
    const timestamp = lastCandle.windowStart;

    let side: 'LONG' | 'SHORT' | null = null;

    if (short > long) side = 'LONG';
    if (short < long) side = 'SHORT';

    if (!side) return null;

    // Simple dynamic confidence based on MA spread strength
    const spread = Math.abs(short - long);
    const confidence = Math.min((spread / lastClose) * 100, 1); // normalized 0–1

    // Simple SL/TP model (example: 0.3% stop, 0.6% TP)
    const stopLoss = side === 'LONG' ? lastClose * 0.997 : lastClose * 1.003;

    const takeProfit = side === 'LONG' ? lastClose * 1.006 : lastClose * 0.994;

    return {
      // ===== Identity =====
      signalId: randomUUID(),
      strategyId: this.strategyId,
      strategyName: this.name,
      version: this.version,

      // ===== Market Context =====
      instrumentId,
      timeframe,
      candleCloseTime: timestamp,

      // ===== Intent =====
      side,
      entryType: 'MARKET',
      entryPrice: lastClose,

      // ===== Risk Model =====
      stopLoss,
      takeProfit,
      maxRiskPct: 0.01,

      // ===== Signal Strength =====
      confidence,

      // ===== Classification =====
      tags: ['trend'],

      // ===== Diagnostics =====
      metadata: {
        sma9: short,
        sma21: long,
        spread,
      },

      // ===== Timing =====
      generatedAt: Date.now(),
    };
  }
}
