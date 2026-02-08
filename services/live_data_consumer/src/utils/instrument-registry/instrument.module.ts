import { Module } from '@nestjs/common';
import { InstrumentRegistryService } from './instrument-registry.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InstrumentRegistryService],
  exports: [InstrumentRegistryService],
})
export class InstrumentModule {}
