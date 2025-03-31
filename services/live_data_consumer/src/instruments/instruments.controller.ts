import { Controller, Get, Post } from "@nestjs/common";
import { InstrumentsService } from "./instruments.service";
import { Exchange, Segment } from "@prisma/client";

@Controller('instruments')
export class InstrumentsController {
    constructor(
        private readonly instrumentsService: InstrumentsService
    ) {}

    @Get()
    async getInstruments() {
        return await this.instrumentsService.getInstruments();
    }

    @Post()
    async addInstrument(data: {
        exchange: Exchange;
        symbol: string;
        segment: Segment;
        trade_enabled: boolean;
        upstox_key: string;
    }) {
        return await this.instrumentsService.addInstrument(data);
    }
}