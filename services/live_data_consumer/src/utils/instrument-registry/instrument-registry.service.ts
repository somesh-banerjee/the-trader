import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { instrument } from '@prisma/client';

type Exchange = 'NSE' | 'BSE' | 'MCX' | 'NCD' | 'BCD';
type Segment = 'EQ' | 'FO' | 'INDEX' | 'COM';

export interface InstrumentInfo {
  id: string;
  exchange: Exchange;
  segment: Segment;
  symbol: string;
  name: string;
  isin: string;
  shortName?: string;
  tradeEnabled: boolean;
  upstoxKey?: string;
  zerodhaKey?: string;
  angeloneKey?: string;
}

export type InstrumentKeyMap = {
  [key: string]: InstrumentInfo;
};

@Injectable()
export class InstrumentRegistryService implements OnModuleInit {
  private readonly logger = new Logger(InstrumentRegistryService.name);

  // Maps for different key types
  private upstoxKeyMap: InstrumentKeyMap = {};
  private zerodhaKeyMap: InstrumentKeyMap = {};
  private angeloneKeyMap: InstrumentKeyMap = {};

  // Map by instrument ID for quick lookup
  private instrumentIdMap: Map<string, InstrumentInfo> = new Map();

  // Array of all tradable instruments
  private tradableInstruments: InstrumentInfo[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadInstruments();
  }

  /**
   * Load all instruments from database and populate maps
   */
  private async loadInstruments(): Promise<void> {
    try {
      const instruments = await this.prisma.instrument.findMany({
        where: {
          trade_enabled: true,
        },
      });

      this.tradableInstruments = instruments.map(
        this.transformToInstrumentInfo,
      );
      this.populateMaps(this.tradableInstruments);

      this.logger.log(
        `Loaded ${this.tradableInstruments.length} tradable instruments`,
      );
    } catch (error) {
      this.logger.error(`Failed to load instruments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform Prisma instrument to InstrumentInfo
   */
  private transformToInstrumentInfo = (
    instrument: instrument,
  ): InstrumentInfo => ({
    id: instrument.id,
    exchange: instrument.exchange,
    segment: instrument.segment,
    symbol: instrument.symbol,
    name: instrument.name,
    isin: instrument.isin,
    shortName: instrument.short_name,
    tradeEnabled: instrument.trade_enabled,
    upstoxKey: instrument.upstox_key,
    zerodhaKey: instrument.zerodha_key,
    angeloneKey: instrument.angelone_key,
  });

  /**
   * Populate all lookup maps
   */
  private populateMaps(instruments: InstrumentInfo[]): void {
    // Clear existing maps
    this.upstoxKeyMap = {};
    this.zerodhaKeyMap = {};
    this.angeloneKeyMap = {};
    this.instrumentIdMap.clear();

    instruments.forEach((instrument) => {
      // Populate ID map
      this.instrumentIdMap.set(instrument.id, instrument);

      // Populate provider key maps
      if (instrument.upstoxKey) {
        this.upstoxKeyMap[instrument.upstoxKey] = instrument;
      }
      if (instrument.zerodhaKey) {
        this.zerodhaKeyMap[instrument.zerodhaKey] = instrument;
      }
      if (instrument.angeloneKey) {
        this.angeloneKeyMap[instrument.angeloneKey] = instrument;
      }
    });
  }

  /**
   * Get instrument by Upstox key
   */
  getByUpstoxKey(key: string): InstrumentInfo | undefined {
    return this.upstoxKeyMap[key];
  }

  /**
   * Get instrument by Zerodha key
   */
  getByZerodhaKey(key: string): InstrumentInfo | undefined {
    return this.zerodhaKeyMap[key];
  }

  /**
   * Get instrument by AngelOne key
   */
  getByAngeloneKey(key: string): InstrumentInfo | undefined {
    return this.angeloneKeyMap[key];
  }

  /**
   * Get instrument by ID
   */
  async getById(id: string): Promise<InstrumentInfo | undefined> {
    const res = this.instrumentIdMap.get(id);

    if(!res){
        const instrument = await this.prisma.instrument.findUnique({
            where: {
                id,
            },
        });
        if(instrument){
            const instrumentInfo = this.transformToInstrumentInfo( instrument);
            this.populateMaps([instrumentInfo]);
            return instrumentInfo;
        }
    }
    return res;
  }

  /**
   * Get all tradable instruments
   */
  getAllTradable(): InstrumentInfo[] {
    return [...this.tradableInstruments];
  }

  /**
   * Get all Upstox keys for tradable instruments
   */
  getUpstoxKeys(): string[] {
    return Object.keys(this.upstoxKeyMap);
  }

  /**
   * Get all Zerodha keys for tradable instruments
   */
  getZerodhaKeys(): string[] {
    return Object.keys(this.zerodhaKeyMap);
  }

  /**
   * Get all AngelOne keys for tradable instruments
   */
  getAngeloneKeys(): string[] {
    return Object.keys(this.angeloneKeyMap);
  }

  /**
   * Check if instrument exists by any provider key
   */
  hasInstrument(
    key: string,
    provider: 'upstox' | 'zerodha' | 'angelone',
  ): boolean {
    switch (provider) {
      case 'upstox':
        return key in this.upstoxKeyMap;
      case 'zerodha':
        return key in this.zerodhaKeyMap;
      case 'angelone':
        return key in this.angeloneKeyMap;
      default:
        return false;
    }
  }

  /**
   * Get instrument count
   */
  getInstrumentCount(): number {
    return this.tradableInstruments.length;
  }

  /**
   * Reload instruments from database
   */
  async reloadInstruments(): Promise<void> {
    await this.loadInstruments();
  }

  /**
   * Get instruments by exchange
   */
  getByExchange(exchange: Exchange): InstrumentInfo[] {
    return this.tradableInstruments.filter(
      (instrument) => instrument.exchange === exchange,
    );
  }

  /**
   * Get instruments by segment
   */
  getBySegment(segment: Segment): InstrumentInfo[] {
    return this.tradableInstruments.filter(
      (instrument) => instrument.segment === segment,
    );
  }
}
