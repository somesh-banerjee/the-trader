import { Module } from "@nestjs/common";
import { DecisionEngineService } from "./decision-engine.service";
import { NatsModule } from "src/utils/nats";
import { PrismaModule } from "src/utils/prisma/prisma.module";
import { DecisionLogicService } from "./decision-logic.service";

@Module({
    imports: [NatsModule, PrismaModule],
  providers: [DecisionEngineService, DecisionLogicService],
})
export class DecisionEngineModule {}