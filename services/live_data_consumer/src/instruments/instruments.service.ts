import { Injectable } from '@nestjs/common';
import { Exchange, Segment } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

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

  async addInstrument(data: {
    exchange: Exchange;
    symbol: string;
    segment: Segment;
    trade_enabled: boolean;
    upstox_key: string;
    zerodha_key?: string;
    angelone_key?: string;
  }) {
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
        trade_enabled: data.trade_enabled,
        upstox_key: data.upstox_key,
        zerodha_key: data.zerodha_key,
        angelone_key: data.angelone_key,
      },
      update: {
        upstox_key: data.upstox_key,
      },
    });
  }

  async updateInstrument(
    id: string,
    data: {
      exchange?: Exchange;
      symbol?: string;
      segment?: Segment;
      trade_enabled?: boolean;
      upstox_key?: string;
      zerodha_key?: string;
      angelone_key?: string;
    },
  ) {
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
