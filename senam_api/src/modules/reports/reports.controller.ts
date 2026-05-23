import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ReportsService } from './reports.service.js';

@ApiTags('admin-reports')
@ApiBearerAuth()
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('super_admin', 'finance_admin')
  @ApiOperation({ summary: 'Sales report aggregated by day' })
  @ApiQuery({ name: 'from', required: true, description: 'ISO date string (start of range)' })
  @ApiQuery({ name: 'to', required: true, description: 'ISO date string (end of range)' })
  @ApiQuery({ name: 'categoryId', required: false })
  salesReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('categoryId') categoryId?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('from and to query params are required');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('from and to must be valid ISO date strings');
    }

    return this.reportsService.salesReport(fromDate, toDate, categoryId);
  }
}
