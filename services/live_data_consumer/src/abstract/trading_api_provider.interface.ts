export interface TradingApiProviderService {
    getWssUrl(): Promise<string>;
    decodeMessage(message: any): any;
}