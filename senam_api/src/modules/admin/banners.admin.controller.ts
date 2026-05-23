import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { AdminService } from './admin.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';

@ApiTags('admin-banners')
@ApiBearerAuth()
@Controller('admin/banners')
export class BannersAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'List all banners (admin)' })
  list() {
    return this.adminService.listBanners();
  }

  @Post()
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a banner' })
  create(
    @Body() dto: CreateBannerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createBanner(dto, user.sub);
  }

  @Patch(':id')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'Update a banner' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateBanner(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (deactivate) a banner' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.deleteBanner(id, user.sub);
  }
}
