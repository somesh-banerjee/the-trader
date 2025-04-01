import { Module } from '@nestjs/common';
import { MarketDataService } from './market_data.service';

@Module({
  imports: [],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
