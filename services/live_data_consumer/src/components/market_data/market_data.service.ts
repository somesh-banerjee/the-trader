import { Injectable, Logger } from '@nestjs/common';
import { NatsService } from 'src/utils/nats';
import { InstrumentRegistryService } from 'src/utils/instrument-registry/instrument-registry.service';
import { FeedResponse, Type } from 'src/utils/upstox/all.interface';
import { CONSTANTS } from 'src/config/constants';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly instrumentRegistryService: InstrumentRegistryService,
    private readonly natsService: NatsService,
  ) {}
  async processMarketData(
    data: FeedResponse,
    instrumentKeyColumn: 'upstox_key' | 'zerodha_key' | 'angelone_key',
  ): Promise<void> {
    if (data?.type !== Type.LIVE_FEED) {
      // ignore if not live feed
      return;
    }

    const { feeds } = data;


    for (const [key, value] of Object.entries(feeds)) {
      const ltpc = value.fullFeed?.marketFF?.ltpc;
      if (ltpc) {
        // Process LTPC data

        // Use instrument registry for fast lookup
        let instrument;
        switch (instrumentKeyColumn) {
          case 'upstox_key':
            instrument = this.instrumentRegistryService.getByUpstoxKey(key);
            break;
          case 'zerodha_key':
            instrument = this.instrumentRegistryService.getByZerodhaKey(key);
            break;
          case 'angelone_key':
            instrument = this.instrumentRegistryService.getByAngeloneKey(key);
            break;
        }

        if (!instrument) {
          this.logger.warn(`Instrument not found for key: ${key}`);
          continue;
        }

        const tick: TickEvent = {
          instrumentId: instrument.id,
          ltp: this.ensureNumber(ltpc.ltp),
          ltq: this.ensureNumber(ltpc.ltq),
          cp: this.ensureNumber(ltpc.cp),
          ts: this.ensureNumber(ltpc.ltt),
        };

        await this.natsService.publish(
          CONSTANTS.RAW_TICK_NATS_SUBJECT,
          tick,
        );
      }
    }
  }

  /**
   * Ensure value is a number, handle 64-bit integer objects from protobuf
   */
  private ensureNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      'low' in value &&
      'high' in value
    ) {
      // Handle protobuf 64-bit integer format
      return (value.high << 32) + value.low;
    }
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return 0;
  }
}

interface TickEvent {
  instrumentId: string;
  ltp: number;
  ltq: number;
  cp: number;
  ts: number;
}
