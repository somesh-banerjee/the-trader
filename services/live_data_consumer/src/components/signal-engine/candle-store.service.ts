import { Injectable, Logger } from '@nestjs/common';
import { CandleData } from '../raw-tick-consumer/raw-tick-consumer.service';
import { InfluxService } from 'src/utils/influx';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CandleStoreService {
  private readonly logger = new Logger(CandleStoreService.name);
  private readonly MAX_HISTORY = 200;

  constructor(private readonly influxService: InfluxService) {}

  // key = instrumentId
  private store = new Map<string, CandleData[]>();

  // prevents duplicate parallel warm loads
  private loadingKeys = new Set<string>();

  async addCandle(
    instrumentId: string,
    candle: CandleData,
  ): Promise<CandleData[]> {
    let history = this.store.get(instrumentId);

    if (!history) {
      await this.ensureWarmCache(instrumentId);
      history = this.store.get(instrumentId) || [];
    }

    // Deduplicate by candle windowStart (important for NATS redelivery)
    const last = history[history.length - 1];
    if (last && last.windowStart === candle.windowStart) {
      this.logger.warn(
        `Duplicate candle detected for ${instrumentId} at ${candle.windowStart}`,
      );
      return history;
    }

    history.push(candle);

    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }

    this.store.set(instrumentId, history);

    return history;
  }

  getHistory(instrumentId: string): CandleData[] {
    return this.store.get(instrumentId) || [];
  }

  /**
   * Prevent multiple concurrent warm loads
   */
  private async ensureWarmCache(instrumentId: string) {
    if (this.loadingKeys.has(instrumentId)) {
      // wait until other load completes
      while (this.loadingKeys.has(instrumentId)) {
        await new Promise((res) => setTimeout(res, 50));
      }
      return;
    }

    this.loadingKeys.add(instrumentId);

    try {
      await this.populateStoreFromInflux(instrumentId);
    } finally {
      this.loadingKeys.delete(instrumentId);
    }
  }

  private async populateStoreFromInflux(instrumentId: string) {
    try {
      const result = await this.influxService.get1mCandlePoints({
        instrumentId,
        hoursAgo: 5,
      });

      const candles = this.mapRowsToCandles(result as any[])
        .sort((a, b) => a.windowStart - b.windowStart) // ensure correct order
        .slice(-this.MAX_HISTORY); // enforce max history

      this.store.set(instrumentId, candles);

      this.logger.log(
        `Warm loaded ${candles.length} candles for ${instrumentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to populate store from Influx for ${instrumentId}`,
        error,
      );

      // ensure store exists even if influx fails
      this.store.set(instrumentId, []);
    }
  }

  private mapRowsToCandles(rows: any[]): CandleData[] {
    return rows
      .filter(
        (r) =>
          r.open !== undefined &&
          r.high !== undefined &&
          r.low !== undefined &&
          r.close !== undefined &&
          r.volume !== undefined &&
          r.trade_count !== undefined &&
          r.vwap !== undefined
      )
      .map((r) => {
        const endTime = new Date(r._time).getTime();
        const startTime = endTime - 60_000; // 1m candle

        return {
          open: Decimal(r.open),
          high: Decimal(r.high),
          low: Decimal(r.low),
          close: Decimal(r.close),
          volume: r.volume ? Decimal(r.volume) : Decimal(0),
          tradeCount: r.trade_count ? Number(r.trade_count) : 0,
          totalValue: r.vwap ? Decimal(r.vwap) : Decimal(0),
          windowStart: startTime,
          endTime,
        };
      });
  }
}
