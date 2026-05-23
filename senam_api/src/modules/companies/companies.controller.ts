import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CompaniesService } from './companies.service.js';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto.js';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active companies' })
  findAll(@Query() query: ListCompaniesQueryDto) {
    return this.companiesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get company detail' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @Public()
  @Get(':id/services')
  @ApiOperation({ summary: 'List services offered by a company' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  findServices(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findServices(id);
  }
}
