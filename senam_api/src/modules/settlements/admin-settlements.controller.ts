import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { SettlementsService } from './settlements.service.js';
import { MarkPaidDto } from './dto/mark-paid.dto.js';

@ApiTags('admin-settlements')
@ApiBearerAuth()
@Roles('super_admin', 'finance_admin')
@Controller('admin/settlements')
export class AdminSettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all settlements (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
  ) {
    return this.settlementsService.listAll(Number(page), Number(limit), companyId, status);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark a settlement as paid with a payout reference (audited)' })
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settlementsService.markPaid(id, dto.payoutReference, user.sub);
  }
}
