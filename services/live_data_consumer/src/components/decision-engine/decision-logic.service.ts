import { Injectable } from '@nestjs/common';
import { StrategySignal } from '../signal-engine/strategies/base.strategy';
import { ConfigService } from '@nestjs/config';

type TradeSide = 'LONG' | 'SHORT' | 'EXIT';

export interface AggregatedSignal {
  instrumentId: string;
  desiredSide: TradeSide;
  aggregatedConfidence: number;
  aggregatedScore?: number;
  entryPrice: number;
  entryType: 'MARKET' | 'LIMIT' | 'STOP';
  contributingStrategies: string[];
  signalCount: number;
}

interface OrderIntent {
  instrumentId: string;
  side: TradeSide;
  price: number;
  type: 'MARKET' | 'LIMIT' | 'STOP';
  confidence: number;
}

@Injectable()
export class DecisionLogicService {
  private readonly allowLong: boolean;
  private readonly allowShort: boolean;
  private readonly minStrategyAgreement: number; // as percentage (0-1)
  private readonly minConfidenceThreshold: number;

  constructor(private readonly config: ConfigService) {
    this.allowLong = this.config.get('DECISION.ALLOW_LONG');
    this.allowShort = this.config.get('DECISION.ALLOW_SHORT');
    this.minStrategyAgreement =
      this.config.get('DECISION.MIN_STRATEGY_AGREEMENT') / 100; // Convert percentage to decimal
    this.minConfidenceThreshold = this.config.get('DECISION.MIN_CONFIDENCE');
  }

  aggregateSignals(signals: StrategySignal[]): AggregatedSignal | null {
    if (!signals.length) return null;

    const instrumentId = signals[0].instrumentId;

    const longs = signals.filter((s) => s.side === 'LONG');
    const shorts = signals.filter((s) => s.side === 'SHORT');
    const exits = signals.filter((s) => s.side === 'EXIT');

    // EXIT PRIORITY
    if (exits.length > 0) {
      const agg = this.computeWeighted(exits);
      return {
        instrumentId,
        desiredSide: 'EXIT',
        ...agg,
        contributingStrategies: exits.map((s) => s.strategyId),
        signalCount: exits.length,
      };
    }

    const longAgg = this.computeWeighted(longs);
    const shortAgg = this.computeWeighted(shorts);

    const totalSignals = signals.length;
    const longAgreement = longs.length / totalSignals;
    const shortAgreement = shorts.length / totalSignals;

    if (
      this.allowLong &&
      longAgreement >= this.minStrategyAgreement &&
      longAgg.aggregatedConfidence >= this.minConfidenceThreshold
    ) {
      return {
        instrumentId,
        desiredSide: 'LONG',
        ...longAgg,
        contributingStrategies: longs.map((s) => s.strategyId),
        signalCount: longs.length,
      };
    }

    if (
      this.allowShort &&
      shortAgreement >= this.minStrategyAgreement &&
      shortAgg.aggregatedConfidence >= this.minConfidenceThreshold
    ) {
      return {
        instrumentId,
        desiredSide: 'SHORT',
        ...shortAgg,
        contributingStrategies: shorts.map((s) => s.strategyId),
        signalCount: shorts.length,
      };
    }

    return null;
  }

  private computeWeighted(
    signals: StrategySignal[],
  ): Omit<
    AggregatedSignal,
    'instrumentId' | 'desiredSide' | 'contributingStrategies' | 'signalCount'
  > {
    const totalWeight = signals.reduce((sum, s) => sum + s.confidence, 0);

    const weightedPrice =
      signals.reduce((sum, s) => sum + s.entryPrice * s.confidence, 0) /
      (totalWeight || 1);

    const weightedScore = signals.some((s) => s.score !== undefined)
      ? signals.reduce((sum, s) => sum + (s.score ?? 0) * s.confidence, 0) /
        (totalWeight || 1)
      : undefined;

    return {
      aggregatedConfidence: totalWeight / signals.length,
      aggregatedScore: weightedScore,
      entryPrice: weightedPrice,
      entryType: signals[0].entryType,
    };
  }

  createOrderIntent(
    aggregated: AggregatedSignal,
    currentPosition: 'LONG' | 'SHORT' | null,
  ): OrderIntent | null {
    const { desiredSide, instrumentId } = aggregated;

    // No position exists
    if (!currentPosition) {
      if (desiredSide === 'LONG' || desiredSide === 'SHORT') {
        return this.buildIntent(aggregated);
      }

      return null;
    }

    // Exit case
    if (desiredSide === 'EXIT') {
      return this.buildIntent(aggregated);
    }

    // Opposite signal → flip
    if (currentPosition !== desiredSide) {
      return this.buildIntent(aggregated);
    }

    // Same direction → ignore
    return null;
  }

  private buildIntent(aggregated: AggregatedSignal): OrderIntent {
    return {
      instrumentId: aggregated.instrumentId,
      side: aggregated.desiredSide,
      price: aggregated.entryPrice,
      type: aggregated.entryType,
      confidence: aggregated.aggregatedConfidence,
    };
  }
}
