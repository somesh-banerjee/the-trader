import { Module } from '@nestjs/common';
import { NatsModule } from 'src/utils/nats';
import { SignalEngineService } from './signal-engine.service';
import { InstrumentModule } from 'src/utils/instrument-registry/instrument.module';
import { CandleStoreService } from './candle-store.service';
import { StrategyRunnerService } from './strategy-runner.service';
import { InfluxModule } from 'src/utils/influx';

@Module({
  imports: [NatsModule, InstrumentModule, InfluxModule],
  providers: [SignalEngineService, CandleStoreService, StrategyRunnerService],
})
export class SignalEngineModule {}
