import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, StringCodec } from 'nats';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsService.name);
  private natsConnection: NatsConnection;
  private sc = StringCodec();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
    this.logger.log('NATS Service initialized');
  }

  async onModuleDestroy() {
    if (this.natsConnection) {
      await this.natsConnection.close();
    }
    this.logger.log('NATS connection closed');
    this.logger.log('NATS Service destroyed');
  }

  async connect() {
    this.natsConnection = await connect({
      servers: this.configService.get<string>('NATS_URL'),
    });
  }

  async publish(subject: string, data: any) {
    if (!this.natsConnection) {
      this.logger.error('NATS connection is not established');
      return;
    }
    try {
      this.natsConnection.publish(
        subject,
        this.sc.encode(JSON.stringify(data)),
      );
      this.logger.log(`Published message to ${subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish message to ${subject}: ${error.message}`,
      );
    }
  }

  async subscribe(
    subject: string,
    callback: (message: string) => Promise<void>,
  ) {
    if (!this.natsConnection) {
      this.logger.error('NATS connection is not established');
      throw new Error('NATS connection is not established');
    }
    try {
      const subscription = this.natsConnection.subscribe(subject);
      this.logger.log(`Subscribed to ${subject}`);

      (async () => {
        for await (const message of subscription) {
          try {
            const decodedMessage = this.sc.decode(message.data);
            await callback(decodedMessage);
          } catch (error) {
            this.logger.error(
              `Error processing message from ${subject}: ${error.message}`,
            );
          }
        }
      })();

      return subscription;
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${subject}: ${error.message}`);
      throw error;
    }
  }
}

@Module({
  providers: [NatsService],
  exports: [NatsService],
})
export class NatsModule {}
