import { CONSTANTS } from "src/config/constants";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { NatsService } from "src/utils/nats";
import { InstrumentRegistryService } from "src/utils/instrument-registry/instrument-registry.service";
import { CandleStoreService } from "./candle-store.service";
import { StrategyRunnerService } from "./strategy-runner.service";
import { CandleData } from "../raw-tick-consumer/raw-tick-consumer.service";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class SignalEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SignalEngineService.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly instrumentRegistry: InstrumentRegistryService,
    private readonly candleStore: CandleStoreService,
    private readonly strategyRunner: StrategyRunnerService,
  ) {}

  async onModuleInit() {
    await this.subscribeToCandles();
  }

  async onModuleDestroy() {}

  private async subscribeToCandles(): Promise<void> {
    await this.natsService.subscribe(
      CONSTANTS.CANDLE_CLOSED_1M_NATS_SUBJECT,
      async (message) => {
        await this.handleMessage(message);
      },
    );

    this.logger.log(`Subscribed to ${CONSTANTS.CANDLE_CLOSED_1M_NATS_SUBJECT}`);
  }

  private async handleMessage(message: string) {
    const { instrumentId, candle: candleRaw } = JSON.parse(message);
    const candle = {
      open: new Decimal(candleRaw.open),
      high: new Decimal(candleRaw.high),
      low: new Decimal(candleRaw.low),
      close: new Decimal(candleRaw.close),
      volume: new Decimal(candleRaw.volume),
      tradeCount: candleRaw.tradeCount,
      totalValue: new Decimal(candleRaw.totalValue),
      windowStart: candleRaw.windowStart,
    } as CandleData;
    this.logger.debug(
      `Received candle for ${instrumentId}: ${JSON.stringify(candle)}`,
    );

    const instrument = await this.instrumentRegistry.getById(instrumentId);
    if (!instrument) {
      this.logger.warn(`Instrument not found: ${instrumentId}`);
      return;
    }

    const history = await this.candleStore.addCandle(instrumentId, candle);

    const signals = this.strategyRunner.run(instrumentId, '1m', history);

    for (const signal of signals) {
      await this.natsService.publish(
        CONSTANTS.STRATEGY_SIGNAL_GENERATED,
        signal,
      );

      this.logger.log(
        `Signal generated: ${signal.strategyName} ${signal.side} ${signal.instrumentId}`,
      );
    }
  }
}
