import { Module } from '@nestjs/common';
import { UpstoxService } from './uptox.service';

@Module({
  providers: [UpstoxService],
  exports: [UpstoxService],
})
export class UpstoxModule {}
