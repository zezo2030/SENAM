import {
  Controller,
  Get,
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
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles('super_admin', 'ops_admin', 'support_admin')
  @ApiOperation({ summary: 'List customer users (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Search email/phone/name' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listUsers(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.adminService.listUsers({
      ...(status !== undefined ? { status } : {}),
      ...(q !== undefined ? { q } : {}),
      page,
      limit,
    });
  }

  @Get(':id')
  @Roles('super_admin', 'ops_admin', 'support_admin')
  @ApiOperation({ summary: 'Get a user by id (admin)' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'Ban or reactivate a user' })
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateUserStatus(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete (anonymise) a user' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.adminService.deleteUser(id, user.sub);
  }
}
