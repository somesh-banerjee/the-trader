import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto, UpdateInstrumentDto } from './instruments.dto';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get()
  async getInstruments() {
    return await this.instrumentsService.getInstruments();
  }

  @Post()
  async addInstrument(@Body() data: CreateInstrumentDto) {
    return await this.instrumentsService.addInstrument(data);
  }

  @Patch(':id')
  async updateInstrument(
    @Param('id') id: string,
    @Body() data: UpdateInstrumentDto,
  ) {
    return await this.instrumentsService.updateInstrument(id, data);
  }

  @Delete(':id')
  async deleteInstrument(@Param('id') id: string) {
    return await this.instrumentsService.deleteInstrument(id);
  }
}
