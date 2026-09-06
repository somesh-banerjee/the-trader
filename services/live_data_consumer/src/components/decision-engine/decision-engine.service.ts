import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CONSTANTS } from 'src/config/constants';
import { NatsService } from 'src/utils/nats';
import { StrategySignal } from '../signal-engine/strategies/base.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import {
  AggregatedSignal,
  DecisionLogicService,
} from './decision-logic.service';

@Injectable()
export class DecisionEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DecisionEngineService.name);
  private readonly minConfidence: number;
  private readonly allowLong: boolean;
  private readonly allowShort: boolean;

  private signalBuffer = new Map<string, StrategySignal[]>();
  private aggregationTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly natsService: NatsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly decisionLogic: DecisionLogicService,
  ) {
    this.minConfidence = this.config.get('DECISION.MIN_CONFIDENCE');
    this.allowLong = this.config.get('DECISION.ALLOW_LONG');
    this.allowShort = this.config.get('DECISION.ALLOW_SHORT');
  }

  async onModuleInit() {
    await this.subscribeToCandles();
  }

  async onModuleDestroy() {}

  private async subscribeToCandles(): Promise<void> {
    await this.natsService.subscribe(
      CONSTANTS.STRATEGY_SIGNAL_GENERATED,
      async (message) => {
        await this.handleMessage(message);
      },
    );

    this.logger.log(`Subscribed to ${CONSTANTS.STRATEGY_SIGNAL_GENERATED}`);
  }

  private async handleMessage(message: string) {
    try {
      const signal: StrategySignal = JSON.parse(message);

      if (signal.confidence < this.minConfidence) return;

      const key = `${signal.instrumentId}_${signal.candleCloseTime}`;

      if (!this.signalBuffer.has(key)) {
        this.signalBuffer.set(key, []);
      }

      this.signalBuffer.get(key)!.push(signal);

      // Schedule aggregation if not already scheduled
      if (!this.aggregationTimeouts.has(key)) {
        const timeout = setTimeout(() => {
          this.processAggregatedSignals(key);
        }, 100); // 100ms aggregation window

        this.aggregationTimeouts.set(key, timeout);
      }
    } catch (err) {
      this.logger.error('Signal parsing error', err);
    }
  }

  private async processAggregatedSignals(key: string) {
    const signals = this.signalBuffer.get(key);

    if (!signals || signals.length === 0) return;

    // Cleanup buffer
    this.signalBuffer.delete(key);
    this.aggregationTimeouts.delete(key);

    const aggregated = this.decisionLogic.aggregateSignals(signals);

    if (!aggregated) return;

    await this.processAggregatedDecision(aggregated, signals);
  }

  private async processAggregatedDecision(
    aggregated: AggregatedSignal,
    rawSignals: StrategySignal[],
  ) {
    const position = await this.prisma.position.findFirst({
      where: {
        instrumentId: aggregated.instrumentId,
      },
    });

    const orderIntent = this.decisionLogic.createOrderIntent(
      aggregated,
      position?.side,
    );

    if (!orderIntent) return;

    await this.storeIntentAudit(aggregated, rawSignals, orderIntent);

    await this.natsService.publish(CONSTANTS.ORDER_INTENT_CREATED, orderIntent);
  }

  private async storeIntentAudit(
    aggregated: AggregatedSignal,
    rawSignals: StrategySignal[],
    orderIntent: any,
  ) {
    try {
    //   await this.prisma.$queryRaw`
    //     INSERT INTO "TradingIntentAudit" (
    //       "instrumentId", "portfolioId", "candleCloseTime", 
    //       "rawSignals", "aggregatedSignal", "finalIntent", "createdAt"
    //     ) VALUES (
    //       ${aggregated.instrumentId}, ${'default'}, NOW(),
    //       ${JSON.stringify(rawSignals)}, ${JSON.stringify(aggregated)}, 
    //       ${JSON.stringify(orderIntent)}, NOW()
    //     )
    //   `;
    await this.prisma.TradingIntentAudit.in;
    } catch (error) {
      this.logger.error('Failed to store intent audit', error);
    }
  }
}
