import { Injectable } from '@nestjs/common';
import { Exchange, Segment } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { CreateInstrumentDto, UpdateInstrumentDto } from './instruments.dto';

@Injectable()
export class InstrumentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getInstruments() {
    return await this.prismaService.instrument.findMany({
      select: {
        id: true,
        exchange: true,
        symbol: true,
        segment: true,
        trade_enabled: true,
        upstox_key: true,
      },
    });
  }

  async addInstrument(data: CreateInstrumentDto) {
    return await this.prismaService.instrument.upsert({
      where: {
        exchange_segment_symbol: {
          exchange: data.exchange,
          symbol: data.symbol,
          segment: data.segment,
        },
      },
      create: {
        exchange: data.exchange,
        symbol: data.symbol,
        segment: data.segment,
        name: data.name,
        isin: data.isin,
        short_name: data.short_name,
        trade_enabled: data.trade_enabled,
        upstox_key: data.upstox_key,
        zerodha_key: data.zerodha_key,
        angelone_key: data.angelone_key,
      },
      update: {},
    });
  }

  async updateInstrument(id: string, data: UpdateInstrumentDto) {
    return await this.prismaService.instrument.update({
      where: { id },
      data,
    });
  }

  async deleteInstrument(id: string) {
    return await this.prismaService.instrument.delete({
      where: { id },
    });
  }
}
