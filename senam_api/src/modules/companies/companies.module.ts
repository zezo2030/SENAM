import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity.js';
import { CompanyServiceEntity } from './entities/company-service.entity.js';
import { CompanyServiceAreaEntity } from './entities/company-service-area.entity.js';
import { CompaniesService } from './companies.service.js';
import { CompaniesController } from './companies.controller.js';
import { ProviderSelfController } from './provider-self.controller.js';
import { ProviderApplicationsController } from './provider-applications.controller.js';
import { FinancialsController } from './financials.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      CompanyServiceEntity,
      CompanyServiceAreaEntity,
    ]),
  ],
  controllers: [
    CompaniesController,
    ProviderSelfController,
    ProviderApplicationsController,
    FinancialsController,
  ],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
