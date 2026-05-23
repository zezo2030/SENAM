import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { CompanyUsersService } from './company-users.service.js';
import { CreateCompanyUserDto } from './dto/create-company-user.dto.js';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto.js';

@ApiTags('provider-staff')
@ApiBearerAuth()
@Roles('provider_owner')
@Controller('provider/me/staff')
export class CompanyUsersController {
  constructor(private readonly companyUsersService: CompanyUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members for the provider company' })
  listStaff(@CurrentUser() user: JwtPayload) {
    return this.companyUsersService.listStaff(user.companyId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new staff member to the provider company' })
  addStaff(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCompanyUserDto,
  ) {
    return this.companyUsersService.addStaff(user.companyId!, dto);
  }

  @Patch(':staffId')
  @ApiOperation({ summary: 'Update a staff member' })
  @ApiParam({ name: 'staffId', type: String, format: 'uuid' })
  updateStaff(
    @CurrentUser() user: JwtPayload,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: UpdateCompanyUserDto,
  ) {
    return this.companyUsersService.updateStaff(user.companyId!, staffId, dto);
  }

  @Delete(':staffId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a staff member from the provider company' })
  @ApiParam({ name: 'staffId', type: String, format: 'uuid' })
  async removeStaff(
    @CurrentUser() user: JwtPayload,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ): Promise<void> {
    return this.companyUsersService.removeStaff(user.companyId!, staffId);
  }
}
