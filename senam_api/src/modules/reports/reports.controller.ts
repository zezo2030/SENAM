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
import { SkipThrottle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ReportsService } from './reports.service.js';

@ApiTags('admin-reports')
@ApiBearerAuth()
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('directory')
  @SkipThrottle()
  @Roles('super_admin', 'ops_admin', 'support_admin')
  @ApiOperation({ summary: 'Directory metrics (companies, reviews) by day' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  directoryReport(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) {
      throw new BadRequestException('from and to query params are required');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('from and to must be valid ISO date strings');
    }

    return this.reportsService.directoryReport(fromDate, toDate);
  }
}
