import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as protobuf from 'protobufjs';
import { TradingApiProviderService } from 'src/abstract/trading_api_provider.interface';
import { FeedResponse } from './all.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UpstoxService implements OnModuleInit, TradingApiProviderService {
  private logger = new Logger(UpstoxService.name);
  private accessToken: string = process.env.ACCESS_TOKEN;
  private protobufRoot: any = null;
  private version: string = 'v3';

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initProtobuf();
    this.accessToken = this.configService.get('UPSTOX_ACCESS_TOKEN');
  }

  private async getMarketFeedUrl(): Promise<string> {
    const url =
      'https://api.upstox.com/' +
      this.version +
      '/feed/market-data-feed/authorize';
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
    const response = await axios.get(url, { headers });
    return response.data.data.authorizedRedirectUri;
  }

  async getWssUrl(): Promise<string> {
    return await this.getMarketFeedUrl();
  }

  private initProtobuf = async () => {
    this.protobufRoot = await protobuf.load(
      __dirname + '/MarketDataFeedV3.proto',
    );
    this.logger.log('Protobuf part initialization complete');
  };

  private decodeProtobuf(buffer: any): FeedResponse | null {
    if (!this.protobufRoot) {
      this.logger.warn('Protobuf part not initialized yet!');
      return null;
    }

    const FeedResponse = this.protobufRoot.lookupType(
      'com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse',
    );
    return FeedResponse.decode(buffer);
  }

  decodeMessage(buffer: any): FeedResponse | null {
    return this.decodeProtobuf(buffer);
  }
}
