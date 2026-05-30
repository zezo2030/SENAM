import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { ServicesService } from './services.service.js';
import { IsUuidLoose } from '../../common/decorators/is-uuid-loose.decorator.js';
class ListServicesQueryDto {
  @IsOptional()
  @IsUuidLoose()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;
}

@ApiTags('catalog')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active services, optionally filtered by category (UUID or slug)' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'categorySlug', required: false, type: String })
  findAll(@Query() query: ListServicesQueryDto) {
    return this.servicesService.findAll({
      categoryId: query.categoryId,
      categorySlug: query.categorySlug,
    });
  }
}
