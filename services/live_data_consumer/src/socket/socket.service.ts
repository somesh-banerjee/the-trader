import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MarketDataService } from 'src/market_data/market_data.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Methods, Modes } from 'src/upstox/all.interface';
import { UpstoxService } from 'src/upstox/uptox.service';
import { v4 as uuidv4 } from 'uuid';
import * as WebSocket from 'ws';

@Injectable()
export class SocketService implements OnModuleInit {
  private logger: Logger = new Logger(SocketService.name);
  private ws: WebSocket | null = null;
  private defautInstrumentKeysToSubscribe: string[] = [
    'NSE_INDEX|Nifty Bank',
    'NSE_INDEX|Nifty 50',
  ];
  private readonly instrumentKeyColumn:
    | 'upstox_key'
    | 'zerodha_key'
    | 'angelone_key' = 'upstox_key'; // Change this to the appropriate key based on your requirements

  constructor(
    private readonly tradingProviderService: UpstoxService,
    private readonly marketDataService: MarketDataService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.defautInstrumentKeysToSubscribe = await this.prisma.instrument
      .findMany({
        where: {
          trade_enabled: true,
        },
        select: {
          [this.instrumentKeyColumn]: true,
        },
      })
      .then((instruments) => {
        return instruments.map(
          (instrument) => instrument[this.instrumentKeyColumn],
        );
      });
    this.logger.log(
      `Instrument keys to subscribe: ${this.defautInstrumentKeysToSubscribe.join(
        ', ',
      )}`,
    );
    this.logger.log('Initializing WebSocket connection...');
    this.start();
  }

  private async connectWebSocket(wsUrl: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, {
        followRedirects: true,
      });

      ws.on('open', () => {
        this.logger.log('Connected to WebSocket');
        resolve(ws);

        // Default subscription
        this.subscribe(this.defautInstrumentKeysToSubscribe, Modes.FULL);
      });

      ws.on('close', () => {
        this.logger.warn('WebSocket Disconnected');
      });

      ws.on('message', (message: WebSocket.Data) => {
        try {
          const decodedData =
            this.tradingProviderService.decodeMessage(message);
          this.marketDataService.processMarketData(
            decodedData,
            this.instrumentKeyColumn,
          );
        } catch (error) {
          this.logger.error(`Error decoding message: ${error.message}`);
        }
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket Error: ${error.message}`);
        reject(error);
      });

      this.ws = ws;
    });
  }

  async start(): Promise<void> {
    try {
      const wsUrl = await this.tradingProviderService.getWssUrl();
      this.ws = await this.connectWebSocket(wsUrl);
    } catch (error) {
      this.logger.error(
        'An error occurred while starting WebSocket: ' + error.message,
      );
    }
  }

  /**
   * Manually subscribe to instrument keys
   */
  subscribe(instrumentKeys: string[], mode: Modes): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('WebSocket is not connected. Cannot subscribe.');
      return;
    }

    const data = {
      guid: uuidv4(),
      method: Methods.SUBSCRIBE,
      data: { mode, instrumentKeys },
    };

    this.ws.send(Buffer.from(JSON.stringify(data)));
    this.logger.log(`Subscribed to: ${instrumentKeys.join(', ')}`);
  }

  /**
   * Manually unsubscribe from instrument keys
   */
  unsubscribe(instrumentKeys: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('WebSocket is not connected. Cannot unsubscribe.');
      return;
    }

    const data = {
      guid: uuidv4(),
      method: Methods.UNSUBSCRIBE,
      data: { instrumentKeys },
    };

    this.ws.send(JSON.stringify(data));
    this.logger.log(`Unsubscribed from: ${instrumentKeys.join(', ')}`);
  }

  /**
   * Manually disconnect the WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.logger.log('WebSocket connection closed manually.');
    } else {
      this.logger.warn('No active WebSocket connection to close.');
    }
  }

  /**
   * Manually reconnect the WebSocket
   */
  async reconnect(): Promise<void> {
    this.logger.log('Reconnecting WebSocket...');
    this.disconnect();
    await this.start();
  }

  /**
   * Set the instrument keys to subscribe to
   */
  setInstrumentKeysToSubscribe(instrumentKeys: string[]): void {
    this.defautInstrumentKeysToSubscribe = instrumentKeys;
    this.logger.log(
      `Instrument keys set to subscribe: ${instrumentKeys.join(', ')}`,
    );
  }

  /**
   * Get the current WebSocket connection status
   */
  getConnectionStatus(): string {
    if (this.ws) {
      return this.ws.readyState === WebSocket.OPEN
        ? 'Connected'
        : 'Disconnected';
    }
    return 'No WebSocket connection';
  }
}
