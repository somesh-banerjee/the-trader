import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfluxService } from 'src/utils/influx';
import { NatsService } from 'src/utils/nats';
import { InstrumentRegistryService } from 'src/utils/instrument-registry/instrument-registry.service';
import { FeedResponse, Type } from 'src/utils/upstox/all.interface';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly influxService: InfluxService,
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
      if (value.ltpc) {
        // Process LTPC data
        const ltpc = value.ltpc;

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
          ltp: ltpc.ltp,
          ltq: ltpc.ltq,
          cp: ltpc.cp,
          ts: data.currentTs,
        };

        await this.natsService.publish('tick.raw', JSON.stringify(tick));

        await this.influxService.writePoint({
          measurement: 'ltp',
          tags: { instrument: instrument.id },
          fields: {
            price: ltpc.ltp,
            prev_close_price: ltpc.cp,
            volume: ltpc.ltq,
          },
        });
      }
    }
  }
}

interface TickEvent {
  instrumentId: string;
  ltp: number;
  ltq: number;
  cp: number;
  ts: number;
}
