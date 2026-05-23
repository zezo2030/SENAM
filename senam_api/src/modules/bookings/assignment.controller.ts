import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { DataSource } from 'typeorm';
import { CompanyUsersService } from '../company-users/company-users.service.js';

class AssignStaffDto {
  @ApiProperty({ description: 'UUID of the staff member to assign', format: 'uuid' })
  @IsUUID()
  staffId!: string;
}

@ApiTags('provider-orders')
@ApiBearerAuth()
@Roles('provider_owner')
@Controller('provider/me/orders')
export class AssignmentController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly companyUsersService: CompanyUsersService,
  ) {}

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a staff member to an order' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Order ID' })
  async assignStaff(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: AssignStaffDto,
  ) {
    // Verify the order belongs to this company
    const orders = await this.dataSource.query(
      `SELECT id, company_id, status FROM orders WHERE id = $1`,
      [orderId],
    ) as Array<{ id: string; company_id: string; status: string }>;

    const order = orders[0];
    if (!order) {
      throw new NotFoundException('order_not_found');
    }
    if (order.company_id !== user.companyId) {
      throw new ForbiddenException('order_not_assigned_to_your_company');
    }

    // Verify the staff member belongs to the same company
    const staffMember = await this.companyUsersService.findById(dto.staffId);
    if (!staffMember || staffMember.companyId !== user.companyId) {
      throw new ForbiddenException('staff_member_not_in_your_company');
    }

    // Update the assignment
    await this.dataSource.query(
      `UPDATE orders SET assigned_staff_id = $1, updated_at = now() WHERE id = $2`,
      [dto.staffId, orderId],
    );

    const updated = await this.dataSource.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId],
    ) as Array<Record<string, unknown>>;

    return updated[0];
  }
}
