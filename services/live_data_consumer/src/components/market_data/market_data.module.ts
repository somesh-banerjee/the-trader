import { Module } from '@nestjs/common';
import { MarketDataService } from './market_data.service';
import { NatsModule } from 'src/utils/nats';
import { InfluxModule } from 'src/utils/influx';
import { PrismaModule } from 'src/utils/prisma/prisma.module';
import { InstrumentModule } from 'src/utils/instrument-registry/instrument.module';

@Module({
  imports: [NatsModule, InfluxModule, PrismaModule, InstrumentModule],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
