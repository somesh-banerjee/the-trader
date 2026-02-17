import { Injectable } from '@nestjs/common';
import { Strategy } from './strategies/base.strategy';
import { EmaCrossoverStrategy } from './strategies/ema-crossover.strategy';
import { CandleData } from '../raw-tick-consumer/raw-tick-consumer.service';
import { StrategySignal } from './strategies/base.strategy';

@Injectable()
export class StrategyRunnerService {
  private strategies: Strategy[] = [];

  constructor() {
    this.strategies.push(new EmaCrossoverStrategy());
  }

  run(instrumentId: string, timeframe: string, candles: CandleData[]): StrategySignal[] {
    const signals = [];

    for (const strategy of this.strategies) {
      const signal = strategy.evaluate(instrumentId, timeframe, candles);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals;
  }
}
