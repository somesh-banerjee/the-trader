import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { SocketModule } from './components/socket/socket.module';
import { InstrumentsModule } from './devpurpose/instruments/instruments.module';
import configs from './config/configuration';
import { validationSchema } from './config/validation';
import { RawTickConsumerModule } from './components/raw-tick-consumer/raw-tick-consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configs],
      validationSchema,
      isGlobal: true,
    }),
    SocketModule,
    InstrumentsModule,
    RawTickConsumerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
