import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UpstoxModule } from 'src/upstox/upstox.module';

@Module({
  imports: [UpstoxModule],
  providers: [SocketService],
})
export class SocketModule {}
