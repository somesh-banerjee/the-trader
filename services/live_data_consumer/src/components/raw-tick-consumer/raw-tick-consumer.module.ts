import { Module } from '@nestjs/common';
import { RawTickConsumerService } from './raw-tick-consumer.service';
import { NatsModule } from 'src/utils/nats';
import { InstrumentModule } from 'src/utils/instrument-registry/instrument.module';
import { InfluxModule } from 'src/utils/influx';

@Module({
  imports: [NatsModule, InstrumentModule, InfluxModule],
  providers: [RawTickConsumerService],
  exports: [RawTickConsumerService],
})
export class RawTickConsumerModule {}
