import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';

@ApiTags('admin-catalog')
@ApiBearerAuth()
@Controller('admin/catalog')
export class CatalogAdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Categories ───────────────────────────────────────────────────────────────

  @Get('categories')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'List all categories (admin)' })
  listCategories() {
    return this.adminService.listCategories();
  }

  @Post('categories')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a category' })
  createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createCategory(dto, user.sub);
  }

  @Patch('categories/:id')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateCategory(id, dto, user.sub);
  }

  @Delete('categories/:id')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (deactivate) a category' })
  deleteCategory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.deleteCategory(id, user.sub);
  }

  // ─── Services ─────────────────────────────────────────────────────────────────

  @Get('services')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'List all services (admin)' })
  @ApiQuery({ name: 'categoryId', required: false })
  listServices(@Query('categoryId') categoryId?: string) {
    return this.adminService.listServices(categoryId);
  }

  @Post('services')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a service' })
  createService(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.createService(dto, user.sub);
  }

  @Patch('services/:id')
  @Roles('super_admin', 'ops_admin')
  @ApiOperation({ summary: 'Update a service' })
  updateService(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateService(id, dto, user.sub);
  }

  @Delete('services/:id')
  @Roles('super_admin', 'ops_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (deactivate) a service' })
  deleteService(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.deleteService(id, user.sub);
  }
}
