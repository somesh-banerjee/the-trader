import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  async processMarketData(data: any): Promise<void> {
    this.logger.log('Processing market data:', data);
  }
}
