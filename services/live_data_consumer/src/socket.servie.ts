import { Injectable, Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import axios from 'axios';
import * as protobuf from 'protobufjs';

@Injectable()
export class SocketService
{
  private logger: Logger = new Logger(SocketService.name);
  private readonly accessToken: string = process.env.ACCESS_TOKEN;
  private protobufRoot: any = null;

  private async getMarketFeedUrl (): Promise<string> {
    const url = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.accessToken}`,
    };
    const response = await axios.get(url, { headers });
    return response.data.data.authorizedRedirectUri;
  };

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

  private initProtobuf = async () => {
    this.protobufRoot = await protobuf.load(__dirname + "/MarketDataFeedV3.proto");
    console.log("Protobuf part initialization complete");
  };

  private decodeProtobuf(buffer: any): any {
    if (!this.protobufRoot) {
      console.warn('Protobuf part not initialized yet!');
      return null;
    }

    const FeedResponse = this.protobufRoot.lookupType(
      'com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse',
    );
    return FeedResponse.decode(buffer);
  }

//   (async () => {
//   try {
//     await initProtobuf(); // Initialize protobuf
//     const wsUrl = await getMarketFeedUrl(); // Get the market feed URL
//     const ws = await connectWebSocket(wsUrl); // Connect to the WebSocket
//   } catch (error) {
//     console.error("An error occurred:", error);
//   }
//   console.log(accessToken);
// })();

  async start(): Promise<void> {
    try {
      await this.initProtobuf(); // Initialize protobuf
      const wsUrl = await this.getMarketFeedUrl(); // Get the market feed URL
      const ws = await this.connectWebSocket(wsUrl); // Connect to the WebSocket
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

}
