import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UpstoxModule } from 'src/upstox/upstox.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SocketController } from './socket.controller';

@Module({
  imports: [UpstoxModule, PrismaModule],
  controllers: [SocketController],
  providers: [SocketService],
})
export class SocketModule {}
