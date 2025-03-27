export class LTPC {
  ltp: number; // Last traded price
  ltt: number; // Last traded timestamp
  ltq: number; // Last traded quantity
  cp: number; // Closing price
}

export class Quote {
  bidQ: number; // Bid quantity
  bidP: number; // Bid price
  askQ: number; // Ask quantity
  askP: number; // Ask price
}

export class MarketLevel {
  bidAskQuote: Quote[]; // List of bid-ask quotes
}

export class OHLC {
  interval: string; // Time interval (e.g., "1s", "1m")
  open: number; // Open price
  high: number; // High price
  low: number; // Low price
  close: number; // Close price
  vol: number; // Volume traded in the interval
  ts: number; // Timestamp
}

export class MarketOHLC {
  ohlc: OHLC[]; // List of OHLC data points
}

export class OptionGreeks {
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  rho: number;
}

export class MarketFullFeed {
  ltpc: LTPC; // Last traded price & close
  marketLevel: MarketLevel; // Bid-ask data
  optionGreeks: OptionGreeks; // Greeks for options
  marketOHLC: MarketOHLC; // OHLC data
  atp: number; // Average traded price
  vtt: number; // Volume traded today
  oi: number; // Open interest
  iv: number; // Implied volatility
  tbq: number; // Total buy quantity
  tsq: number; // Total sell quantity
}

export class IndexFullFeed {
  ltpc: LTPC; // Last traded price & close
  marketOHLC: MarketOHLC; // OHLC data
}

export class FullFeed {
  marketFF?: MarketFullFeed; // Market feed
  indexFF?: IndexFullFeed; // Index feed
}

export class FirstLevelWithGreeks {
  ltpc: LTPC; // Last traded price & close
  firstDepth: Quote; // First level bid-ask data
  optionGreeks: OptionGreeks; // Option Greeks
  vtt: number; // Volume traded today
  oi: number; // Open interest
  iv: number; // Implied volatility
}

export class Feed {
  ltpc?: LTPC;
  fullFeed?: FullFeed;
  firstLevelWithGreeks?: FirstLevelWithGreeks;
  requestMode: RequestMode;
}

export enum RequestMode {
  LTPC = 0,
  FULL_D5 = 1,
  OPTION_GREEKS = 2,
  FULL_D30 = 3,
}

export enum Type {
  INITIAL_FEED = 0,
  LIVE_FEED = 1,
  MARKET_INFO = 2,
}

export enum MarketStatus {
  PRE_OPEN_START = 0,
  PRE_OPEN_END = 1,
  NORMAL_OPEN = 2,
  NORMAL_CLOSE = 3,
  CLOSING_START = 4,
  CLOSING_END = 5,
}

export class MarketInfo {
  segmentStatus: Record<string, MarketStatus>; // Map of market segments to statuses
}

export class FeedResponse {
  type: Type; // Response type
  feeds: Record<string, Feed>; // Map of feeds
  currentTs: number; // Current timestamp
  marketInfo: MarketInfo; // Market info
}

export enum Methods {
  SUBSCRIBE = 'sub',
  UNSUBSCRIBE = 'unsub',
  CHANGE_MODE = 'change_mode',
}

export enum Modes {
  LTPC = 'ltpc',
  FULL = 'full',
  OPTION_GREEKS = 'option_chain',
}