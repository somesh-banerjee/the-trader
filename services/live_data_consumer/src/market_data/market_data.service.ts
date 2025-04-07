import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfluxService } from 'src/influx';
import { NatsService } from 'src/nats';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedResponse, Type } from 'src/upstox/all.interface';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly influxService: InfluxService,
    private readonly prisma: PrismaService,
    private readonly natsService: NatsService,
    private readonly configService: ConfigService,
  ) {}
  async processMarketData(
    data: FeedResponse,
    instrumentKeyColumn: 'upstox_key' | 'zerodha_key' | 'angelone_key',
  ): Promise<void> {
    this.logger.log('Processing market data:', data.type);

    if (data?.type !== Type.LIVE_FEED) {
      // ignore if not live feed
      return;
    }

    const { feeds } = data;

    for (const [key, value] of Object.entries(feeds)) {
      if (value.ltpc) {
        // Process LTPC data
        const ltpc = value.ltpc;

        const { id: instrumentId } =
          await this.prisma.instrument.findFirstOrThrow({
            where: { [instrumentKeyColumn]: key },
            select: { id: true },
          });

        await this.natsService.publish(
          this.configService.get<string>('NATS_SUBJECT'),
          JSON.stringify(value),
        );

        await this.influxService.writePoint({
          measurement: 'ltp',
          tags: { instrument: instrumentId },
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
