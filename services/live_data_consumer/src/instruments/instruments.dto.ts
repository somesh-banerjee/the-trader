import { ApiProperty } from '@nestjs/swagger';
import { Exchange, Segment } from '@prisma/client';

export class CreateInstrumentDto {
  @ApiProperty({ description: 'Exchange code', enum: Exchange, default: Exchange.NSE })
  exchange: Exchange;

  @ApiProperty({ description: 'Instrument symbol', type: 'string' })
  symbol: string;

  @ApiProperty({ description: 'Segment code', enum: Segment })
  segment: Segment;

  @ApiProperty({ description: 'Trade enabled flag', default: false })
  trade_enabled: boolean;

  @ApiProperty({ description: 'Upstox key' })
  upstox_key: string;

  @ApiProperty({ description: 'Zerodha key' })
  zerodha_key?: string;

  @ApiProperty({ description: 'Angelone key' })
  angelone_key?: string;
}

export class UpdateInstrumentDto {
  @ApiProperty({ description: 'Exchange code', enum: Exchange })
  exchange: Exchange;

  @ApiProperty({ description: 'Instrument symbol', type: 'string' })
  symbol: string;

  @ApiProperty({ description: 'Segment code', enum: Segment })
  segment: Segment;

  @ApiProperty({ description: 'Trade enabled flag', default: false })
  trade_enabled: boolean;

  @ApiProperty({ description: 'Upstox key' })
  upstox_key: string;
}
