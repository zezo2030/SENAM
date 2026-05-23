import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
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
import { AdminService } from './admin.service.js';
import { InterveneOrderDto } from './dto/intervene-order.dto.js';

@ApiTags('admin-orders')
@ApiBearerAuth()
@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles('super_admin', 'ops_admin', 'support_admin', 'finance_admin')
  @ApiOperation({ summary: 'List all orders (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listOrders(
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.adminService.listOrders({
      ...(status !== undefined ? { status } : {}),
      ...(companyId !== undefined ? { companyId } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      page,
      limit,
    });
  }

  @Post(':id/intervene')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin intervention on an order (cancel, refund, reassign)' })
  intervene(
    @Param('id') id: string,
    @Body() dto: InterveneOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.intervene(id, dto, user.sub);
  }
}
