import { Module } from '@nestjs/common';
import { MarketDataService } from './market_data.service';
import { NatsModule } from 'src/nats';
import { InfluxModule } from 'src/influx';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [NatsModule, InfluxModule, PrismaModule],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
