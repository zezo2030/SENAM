import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { CompaniesService } from './companies.service.js';
import { RegisterCompanyApplicationDto } from './dto/register-company-application.dto.js';

@ApiTags('provider-applications')
@Controller('provider/applications')
export class ProviderApplicationsController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Submit a company application (KYC). Creates a pending company + owner login; admin must approve before the company becomes visible to customers.',
  })
  async submit(@Body() dto: RegisterCompanyApplicationDto) {
    return this.companiesService.submitApplication(dto);
  }

  @Public()
  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Get the current status of a company application by the companyId returned at submission.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.getApplicationStatus(id);
  }

  @Public()
  @Get(':id/detail')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Get the full application detail (company info, services, photos, plan) by companyId.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.getApplicationDetail(id);
  }
}
