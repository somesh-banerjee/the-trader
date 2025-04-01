import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UpstoxModule } from 'src/upstox/upstox.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SocketController } from './socket.controller';
import { MarketDataModule } from 'src/market_data/market_data.module';

@Module({
  imports: [UpstoxModule, PrismaModule, MarketDataModule],
  controllers: [SocketController],
  providers: [SocketService],
})
export class SocketModule {}
