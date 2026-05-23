import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

@ApiTags('admin-coupons')
@ApiBearerAuth()
@Controller('admin/coupons')
export class CouponsAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'List coupons (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listCoupons(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.adminService.listCoupons(page, limit);
  }

  @Post()
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a coupon' })
  createCoupon(
    @Body() dto: CreateCouponDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createCoupon(dto, user.sub);
  }

  @Patch(':id')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'Update a coupon' })
  updateCoupon(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateCoupon(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (deactivate) a coupon' })
  deleteCoupon(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.deleteCoupon(id, user.sub);
  }
}
