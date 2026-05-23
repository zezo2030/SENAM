import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { ServicesService } from './services.service.js';

class ListServicesQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

@ApiTags('catalog')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active services, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  findAll(@Query() query: ListServicesQueryDto) {
    return this.servicesService.findAll(query.categoryId);
  }
}
