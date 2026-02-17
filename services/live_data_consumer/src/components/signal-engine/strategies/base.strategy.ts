import { CandleData } from '../../raw-tick-consumer/raw-tick-consumer.service';

export interface StrategySignal {
  // ===== Identity =====
  signalId: string; // UUID
  strategyId: string; // unique config instance id
  strategyName: string; // human readable
  version: number; // strategy version

  // ===== Market Context =====
  instrumentId: string;
  timeframe: string;
  candleCloseTime: number; // epoch ms

  // ===== Intent =====
  side: 'LONG' | 'SHORT' | 'EXIT';
  entryType: 'MARKET' | 'LIMIT' | 'STOP';
  entryPrice: number;

  // ===== Risk Model =====
  stopLoss?: number;
  takeProfit?: number;
  maxRiskPct?: number; // e.g. 0.01 = 1% capital cap

  // ===== Signal Strength =====
  confidence: number; // 0–1 (mandatory)
  score?: number; // raw numeric score (ML-ready)

  // ===== Classification =====
  tags?: string[]; // ["trend", "mean-reversion"]

  // ===== Diagnostics =====
  metadata?: Record<string, any>; // indicator values

  // ===== Timing =====
  generatedAt: number; // epoch ms
}

export interface Strategy {
  name: string;
  evaluate(
    instrumentId: string,
    timeframe: string,
    candles: CandleData[],
  ): StrategySignal | null;
}
