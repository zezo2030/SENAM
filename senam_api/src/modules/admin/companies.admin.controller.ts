import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CompaniesService } from '../companies/companies.service.js';
import { ApproveCompanyDto } from './dto/approve-company.dto.js';
import { SuspendCompanyDto } from './dto/suspend-company.dto.js';
import { UpdateCommissionDto } from './dto/update-commission.dto.js';

@ApiTags('admin-companies')
@ApiBearerAuth()
@Controller('admin/companies')
export class CompaniesAdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly companiesService: CompaniesService,
  ) {}

  @Get(':id/detail')
  @Roles('super_admin', 'ops_admin', 'finance_admin', 'support_admin')
  @ApiOperation({ summary: 'Full application detail (services, photos, plan, contact)' })
  getCompanyDetail(@Param('id') id: string) {
    return this.companiesService.getApplicationDetail(id);
  }

  @Get()
  @Roles('super_admin', 'ops_admin', 'finance_admin', 'support_admin')
  @ApiOperation({ summary: 'List all companies (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listCompanies(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.adminService.listCompanies({
      ...(status !== undefined ? { status } : {}),
      page,
      limit,
    });
  }

  @Post(':id/approve')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending company' })
  approveCompany(
    @Param('id') id: string,
    @Body() dto: ApproveCompanyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.approveCompany(id, user.sub);
  }

  @Post(':id/suspend')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a company' })
  suspendCompany(
    @Param('id') id: string,
    @Body() dto: SuspendCompanyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.suspendCompany(id, user.sub, dto);
  }

  @Patch(':id/commission')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update company commission (super_admin only)' })
  updateCommission(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateCommission(id, dto, user.sub);
  }
}
