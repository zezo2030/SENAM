import {
  Controller,
  Get,
  Patch,
  Body,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { CompaniesService } from './companies.service.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';

@ApiTags('provider-company')
@ApiBearerAuth()
@Roles('provider_owner')
@Controller('provider/me/company')
export class ProviderSelfController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated provider's company profile" })
  async getMyCompany(@CurrentUser() user: JwtPayload) {
    const company = await this.companiesService.findById(user.companyId!);
    if (!company) {
      throw new NotFoundException('company_not_found');
    }
    return company;
  }

  @Patch()
  @ApiOperation({ summary: "Update the authenticated provider's company profile" })
  updateMyCompany(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.companiesService.updateProviderProfile(user.companyId!, dto);
  }
}
