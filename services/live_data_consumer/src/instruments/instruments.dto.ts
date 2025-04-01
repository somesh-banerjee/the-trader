import { ApiProperty } from '@nestjs/swagger';
import { Exchange, Segment } from '@prisma/client';

export class CreateInstrumentDto {
  @ApiProperty({ description: 'Exchange code', enum: Exchange, default: Exchange.NSE })
  exchange: Exchange;

  @ApiProperty({ description: 'Instrument symbol', type: 'string' })
  symbol: string;

  @ApiProperty({ description: 'Segment code', enum: Segment })
  segment: Segment;

  @ApiProperty({ description: 'Instrument name' })
  name: string;

  @ApiProperty({ description: 'Instrument type' })
  isin: string;

  @ApiProperty({ description: 'Instrument short name' })
  short_name: string; 

  @ApiProperty({ description: 'Trade enabled flag', default: false })
  trade_enabled: boolean;

  @ApiProperty({ description: 'Upstox key' })
  upstox_key: string;

  @ApiProperty({ description: 'Zerodha key' })
  zerodha_key?: string;

  @ApiProperty({ description: 'Angelone key' })
  angelone_key?: string;
}

export class UpdateInstrumentDto extends CreateInstrumentDto {
  
}
