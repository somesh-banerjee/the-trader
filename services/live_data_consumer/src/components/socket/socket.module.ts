import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UpstoxModule } from 'src/utils/upstox/upstox.module';
import { PrismaModule } from 'src/utils/prisma/prisma.module';
import { SocketController } from './socket.controller';
import { MarketDataModule } from 'src/components/market_data/market_data.module';
import { InstrumentModule } from 'src/utils/instrument-registry/instrument.module';

@Module({
  imports: [UpstoxModule, MarketDataModule, InstrumentModule],
  controllers: [SocketController],
  providers: [SocketService],
})
export class SocketModule {}
