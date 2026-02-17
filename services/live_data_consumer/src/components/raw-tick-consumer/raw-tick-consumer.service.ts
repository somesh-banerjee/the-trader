import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { NatsService } from 'src/utils/nats';
import {
  InstrumentRegistryService,
  InstrumentInfo,
} from 'src/utils/instrument-registry/instrument-registry.service';
import { CONSTANTS } from 'src/config/constants';
import { InfluxService } from 'src/utils/influx';
import { Decimal } from '@prisma/client/runtime/library';

export { InstrumentInfo };

export interface TickEvent {
  instrumentId: string;
  ltp: number;
  ltq: number;
  cp: number;
  ts: number;
}

export interface CandleData {
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: Decimal;
  tradeCount: number;
  vwap: Decimal;
}

@Injectable()
export class RawTickConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RawTickConsumerService.name);

  // Store candle data for each instrument
  private candleWindows: Map<
    string,
    {
      open: Decimal;
      high: Decimal;
      low: Decimal;
      close: Decimal;
      volume: Decimal;
      tradeCount: number;
      totalValue: Decimal; // For VWAP calculation
      windowStart: number;
    }
  > = new Map();

  constructor(
    private readonly natsService: NatsService,
    private readonly influxService: InfluxService,

    private readonly instrumentRegistry: InstrumentRegistryService,
  ) {}

  async onModuleInit() {
    await this.subscribeToTicks();
  }

  /**
   * Cleanup method to flush remaining candles
   */
  async onModuleDestroy() {
    this.logger.log('Flushing remaining candle data...');

    for (const [instrumentId, candle] of this.candleWindows.entries()) {
      const instrument = await this.instrumentRegistry.getById(instrumentId);
      if (instrument) {
        await this.writeCandleToInflux(instrumentId, candle, instrument);
      }
    }

    this.candleWindows.clear();
    this.logger.log('Candle data flushed successfully');
  }

  /**
   * Subscribe to the ticks.raw subject
   */
  private async subscribeToTicks(): Promise<void> {
    try {
      await this.natsService.subscribe(
        CONSTANTS.RAW_TICK_NATS_SUBJECT,
        async (message) => {
          await this.handleTickMessage(message);
        },
      );

      this.logger.log(
        `Successfully subscribed to ${CONSTANTS.RAW_TICK_NATS_SUBJECT}`,
      );
    } catch (error) {
      this.logger.error(`Failed to subscribe to ticks.raw: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle incoming tick messages
   */
  private async handleTickMessage(message: string): Promise<void> {
    try {
      const tick: TickEvent = JSON.parse(message);

      const instrument = await this.instrumentRegistry.getById(
        tick.instrumentId,
      );

      if (!instrument) {
        this.logger.warn(`Instrument not found for ID: ${tick.instrumentId}`);
        return;
      }

      // Build 1-minute candle from tick data
      await this.buildCandleFromTick(tick, instrument);
    } catch (error) {
      this.logger.error(
        `Error processing tick message: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Build 1-minute candle from tick data
   */
  private async buildCandleFromTick(
    tick: TickEvent,
    instrument: InstrumentInfo,
  ): Promise<void> {
    const instrumentId = tick.instrumentId;
    const tickTime = tick.ts;

    // Get current minute window start (floor to nearest minute)
    const currentWindowStart = Math.floor(tickTime / 60000) * 60000;

    this.logger.debug(
      `Processing tick for ${instrument.symbol}: ` +
        `Price=${tick.ltp}, Volume=${tick.ltq}, Time=${new Date(tickTime).toISOString()}`,
    );

    // Get existing candle window or create new one
    let candle = this.candleWindows.get(instrumentId);

    // If no existing window or window has changed, create new candle
    if (!candle || candle.windowStart !== currentWindowStart) {
      // If there's an existing candle, write it to InfluxDB before creating new one
      if (candle) {
        this.logger.debug(
          `Window changed, writing candle for ${instrument.symbol}`,
        );
        await this.writeCandleToInflux(instrumentId, candle, instrument);
      }

      // Create new candle window
      candle = {
        open: new Decimal(tick.ltp),
        high: new Decimal(tick.ltp),
        low: new Decimal(tick.ltp),
        close: new Decimal(tick.ltp),
        volume: new Decimal(tick.ltq),
        tradeCount: 1,
        totalValue: new Decimal(tick.ltp).mul(new Decimal(tick.ltq)), // For VWAP calculation
        windowStart: currentWindowStart,
      };

      this.logger.debug(
        `New candle window started for ${instrument.symbol}: ` +
          `Open=${candle.open.toNumber()}, WindowStart=${new Date(currentWindowStart).toISOString()}`,
      );
    } else {
      // Update existing candle
      const tickPrice = new Decimal(tick.ltp);
      const tickVolume = new Decimal(tick.ltq);

      if (tickPrice.gt(candle.high)) {
        candle.high = tickPrice;
      }
      if (tickPrice.lt(candle.low)) {
        candle.low = tickPrice;
      }
      candle.close = tickPrice;
      candle.volume = candle.volume.add(tickVolume);
      candle.tradeCount += 1;
      candle.totalValue = candle.totalValue.add(tickPrice.mul(tickVolume));

      this.logger.debug(
        `Updated candle for ${instrument.symbol}: ` +
          `H=${candle.high.toNumber()}, L=${candle.low.toNumber()}, C=${candle.close.toNumber()}, V=${candle.volume.toNumber()}`,
      );
    }

    // Store updated candle
    this.candleWindows.set(instrumentId, candle);
  }

  /**
   * Write completed candle to InfluxDB
   */
  private async writeCandleToInflux(
    instrumentId: string,
    candle: {
      open: Decimal;
      high: Decimal;
      low: Decimal;
      close: Decimal;
      volume: Decimal;
      tradeCount: number;
      totalValue: Decimal;
      windowStart: number;
    },
    instrument: InstrumentInfo,
  ): Promise<void> {
    try {
      // Calculate VWAP (Volume Weighted Average Price)
      const vwap = candle.volume.gt(new Decimal(0))
        ? candle.totalValue.div(candle.volume)
        : new Decimal(0);

      await this.influxService.writePoint({
        measurement: 'candles_1m',
        tags: {
          instrument: instrumentId,
        },
        fields: {
          open: candle.open.toNumber(),
          high: candle.high.toNumber(),
          low: candle.low.toNumber(),
          close: candle.close.toNumber(),
          volume: candle.volume.toNumber(),
          trade_count: candle.tradeCount,
          vwap: vwap.toNumber(),
        },
        timestamp: candle.windowStart,
      });

      this.logger.log(
        `1-minute candle written for ${instrument.symbol}: ` +
          `O:${candle.open.toNumber()} H:${candle.high.toNumber()} L:${candle.low.toNumber()} C:${candle.close.toNumber()} V:${candle.volume.toNumber()}`,
      );
    } catch (error) {
      this.logger.error(
        `Error writing candle to InfluxDB: ${error.message}`,
        error.stack,
      );
    }
  }
}
