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
      this.natsConnection.publish(subject, this.sc.encode(JSON.stringify(data)));
      this.logger.log(`Published message to ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to ${subject}: ${error.message}`);
    }
  }
}

@Module({
  providers: [NatsService],
  exports: [NatsService],
})
export class NatsModule {}
