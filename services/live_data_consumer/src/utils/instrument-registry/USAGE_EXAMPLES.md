# Instrument Registry Usage Examples

This document demonstrates how to use the `InstrumentRegistryService` to store and retrieve tradable instruments across different modules in your NestJS application.

## Overview

The `InstrumentRegistryService` provides fast, in-memory access to tradable instruments using multiple lookup strategies:
- By provider keys (Upstox, Zerodha, AngelOne)
- By instrument ID
- By exchange and segment
- Full list access

## Basic Usage

### 1. Inject the Service

```typescript
import { InstrumentRegistryService } from '../instrument/instrument-registry.service';

@Injectable()
export class YourService {
  constructor(
    private readonly instrumentRegistry: InstrumentRegistryService
  ) {}
}
```

### 2. Get Instrument by Provider Key

```typescript
// Get instrument by Upstox key
const instrument = this.instrumentRegistry.getByUpstoxKey('NSE_EQ|RELIANCE');

if (instrument) {
  console.log(`Found instrument: ${instrument.symbol} - ${instrument.name}`);
}
```

### 3. Check if Instrument Exists

```typescript
const isTradable = this.instrumentRegistry.hasInstrument('NSE_EQ|RELIANCE', 'upstox');
if (isTradable) {
  // Instrument exists and is tradable
}
```

### 4. Get All Tradable Instruments

```typescript
const allInstruments = this.instrumentRegistry.getAllTradable();
console.log(`Total tradable instruments: ${allInstruments.length}`);
```

## Advanced Usage Examples

### 5. Filter by Exchange

```typescript
const nseInstruments = this.instrumentRegistry.getByExchange('NSE');
const bseInstruments = this.instrumentRegistry.getByExchange('BSE');
```

### 6. Filter by Segment

```typescript
const equityInstruments = this.instrumentRegistry.getBySegment('EQ');
const indexInstruments = this.instrumentRegistry.getBySegment('INDEX');
const f&oInstruments = this.instrumentRegistry.getBySegment('FO');
```

### 7. Get Provider Keys for Subscription

```typescript
// Get all Upstox keys for WebSocket subscription
const upstoxKeys = this.instrumentRegistry.getUpstoxKeys();
this.socketService.subscribe(upstoxKeys, Modes.FULL);

// Get Zerodha keys
const zerodhaKeys = this.instrumentRegistry.getZerodhaKeys();

// Get AngelOne keys
const angeloneKeys = this.instrumentRegistry.getAngeloneKeys();
```

### 8. Market Data Processing

```typescript
processMarketData(feedKey: string, data: any) {
  // Fast lookup using the registry
  const instrument = this.instrumentRegistry.getByUpstoxKey(feedKey);
  
  if (!instrument) {
    this.logger.warn(`Unknown instrument key: ${feedKey}`);
    return;
  }
  
  // Process market data with instrument info
  this.processPriceData(instrument.id, data);
}
```

### 9. Trading Logic

```typescript
executeTrade(upstoxKey: string, orderDetails: OrderDetails) {
  const instrument = this.instrumentRegistry.getByUpstoxKey(upstoxKey);
  
  if (!instrument) {
    throw new Error(`Instrument not found: ${upstoxKey}`);
  }
  
  if (!instrument.tradeEnabled) {
    throw new Error(`Instrument not trade enabled: ${instrument.symbol}`);
  }
  
  // Execute trade with instrument details
  return this.brokerService.placeOrder({
    instrumentId: instrument.id,
    symbol: instrument.symbol,
    exchange: instrument.exchange,
    ...orderDetails
  });
}
```

### 10. Instrument Search

```typescript
searchInstruments(query: string): InstrumentInfo[] {
  const allInstruments = this.instrumentRegistry.getAllTradable();
  
  return allInstruments.filter(instrument => 
    instrument.symbol.toLowerCase().includes(query.toLowerCase()) ||
    instrument.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

### 11. Statistics and Reporting

```typescript
getInstrumentStatistics() {
  const instruments = this.instrumentRegistry.getAllTradable();
  
  const stats = {
    total: instruments.length,
    byExchange: instruments.reduce((acc, inst) => {
      acc[inst.exchange] = (acc[inst.exchange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    bySegment: instruments.reduce((acc, inst) => {
      acc[inst.segment] = (acc[inst.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
  
  return stats;
}
```

## Performance Benefits

The instrument registry provides significant performance improvements over database queries:

1. **O(1) Lookup Time**: Direct object property access vs database queries
2. **No Database Latency**: In-memory access eliminates network round trips
3. **Reduced Database Load**: One-time load on startup, then cached access
4. **Consistent Performance**: Predictable lookup times regardless of data size

## Memory Management

The service automatically loads instruments on module initialization:

```typescript
async onModuleInit() {
  await this.loadInstruments(); // Loads all tradable instruments
}
```

You can manually reload instruments if needed:

```typescript
await this.instrumentRegistry.reloadInstruments();
```

## Error Handling

Always handle cases where instruments might not be found:

```typescript
const instrument = this.instrumentRegistry.getByUpstoxKey(key);
if (!instrument) {
  this.logger.warn(`Instrument not found for key: ${key}`);
  return; // or throw an error, depending on your use case
}
```

## Module Setup

Ensure the `InstrumentModule` is imported in any module that needs access to instruments:

```typescript
@Module({
  imports: [InstrumentModule],
  providers: [YourService],
})
export class YourModule {}
```

## Type Safety

The service provides full TypeScript support with the `InstrumentInfo` interface:

```typescript
interface InstrumentInfo {
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
```

This ensures type safety across your application when working with instrument data.
