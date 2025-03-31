import { Injectable, Logger } from '@nestjs/common';
import { Methods, Modes } from 'src/upstox/all.interface';
import { UpstoxService } from 'src/upstox/uptox.service';
import { v4 as uuidv4 } from 'uuid';
import * as WebSocket from 'ws';

@Injectable()
export class SocketService {
  private logger: Logger = new Logger(SocketService.name);
  private ws: WebSocket | null = null; 

  constructor(
    private readonly tradingProviderService: UpstoxService,
  ) {}

  private async connectWebSocket(wsUrl: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, {
        followRedirects: true,
      });

      ws.on('open', () => {
        this.logger.log('Connected to WebSocket');
        resolve(ws);

        // Set a timeout to send a subscription message after 1 second
        setTimeout(() => {
          const data = {
            guid: uuidv4(),
            method: Methods.SUBSCRIBE,
            data: {
              mode: Modes.FULL,
              instrumentKeys: ['NSE_INDEX|Nifty Bank', 'NSE_INDEX|Nifty 50'],
            },
          };
          ws.send(JSON.stringify(data));
          this.logger.log('Subscription message sent');
        }, 1000);
      });

      ws.on('close', () => {
        this.logger.warn('WebSocket Disconnected');
      });

      ws.on('message', (message: WebSocket.Data) => {
        try {
          const decodedData =
            this.tradingProviderService.decodeMessage(message);
          this.logger.verbose(
            `Received message: ${JSON.stringify(decodedData)}`,
          );
        } catch (error) {
          this.logger.error(`Error decoding message: ${error.message}`);
        }
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket Error: ${error.message}`);
        reject(error);
      });
    });
  }

  async start(): Promise<void> {
    try {
      const wsUrl = await this.tradingProviderService.getWssUrl(); // Get the market feed URL
      this.ws = await this.connectWebSocket(wsUrl); // Connect to the WebSocket
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
}
