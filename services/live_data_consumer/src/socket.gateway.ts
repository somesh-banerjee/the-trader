import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import axios from 'axios';

@WebSocketGateway()
@Injectable()
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('SocketGateway');
  private socketSocket: WebSocket;
  private readonly accessToken: string = process.env.ACCESS_TOKEN;
  private wsUrl: string;


  async afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
    try {
      // this.wsUrl = await this.getMarketFeedUrl();
    } catch (error) {
      this.logger.error(`Error fetching market feed URL: ${error.message}`);
    }
  }

  async handleConnection() {
    this.logger.log('Client Connected');
    try {
      this.socketSocket = await this.connectWebSocket(this.wsUrl);
    } catch (error) {
      this.logger.error(`WebSocket Connection Error: ${error.message}`);
    }
  }

  private async getMarketFeedUrl (): Promise<string> {
    const url = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.accessToken}`,
    };
    const response = await axios.get(url, { headers });
    return response.data.data.authorizedRedirectUri;
  };

  async connectWebSocket(wsUrl: string): Promise<WebSocket> {
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
            guid: 'someguid',
            method: 'sub',
            data: {
              mode: 'full',
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
          const decodedData = this.decodeProtobuf(message);
          this.logger.log(`Received message: ${JSON.stringify(decodedData)}`);
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

  decodeProtobuf(message: WebSocket.Data): any {
    // Implement Protobuf decoding logic here
    return message.toString(); // Placeholder: Convert Buffer to string
  }

  handleDisconnect() {
    this.logger.warn('Client Disconnected');
    if (this.socketSocket) {
      this.socketSocket.close();
    }
  }
}
