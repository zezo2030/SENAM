import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { SlotsService } from './slots.service.js';
import { TimeSlotEntity } from './entities/time-slot.entity.js';

@ApiTags('slots')
@Controller('companies/:companyId/slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List available time slots for a company on a given date' })
  @ApiParam({ name: 'companyId', type: String })
  @ApiQuery({ name: 'date', type: String, description: 'ISO date: YYYY-MM-DD' })
  async getSlots(
    @Param('companyId') companyId: string,
    @Query('date') date: string,
  ): Promise<TimeSlotEntity[]> {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Query param "date" must be in YYYY-MM-DD format');
    }
    return this.slotsService.getSlots(companyId, date);
  }
}
