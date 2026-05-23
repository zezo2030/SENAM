import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { DataSource } from 'typeorm';
import { OrderEntity } from './entities/order.entity.js';

@ApiTags('provider-orders')
@ApiBearerAuth()
@Roles('provider_owner', 'provider_staff')
@Controller('provider/me/orders')
export class ProviderInboxController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: "List orders for the provider's company" })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  async listProviderOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ): Promise<OrderEntity[]> {
    const repo = this.dataSource.getRepository(OrderEntity);
    const qb = repo
      .createQueryBuilder('o')
      .where('o.company_id = :companyId', { companyId: user.companyId })
      .orderBy('o.created_at', 'DESC');

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    return qb.getMany();
  }
}
