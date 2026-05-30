import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity.js';
import { CompanyServiceEntity } from './entities/company-service.entity.js';
import { CompanyServiceAreaEntity } from './entities/company-service-area.entity.js';
import { CompanyGalleryPhotoEntity } from './entities/company-gallery-photo.entity.js';
import { CompaniesService } from './companies.service.js';
import { GalleryService } from './gallery.service.js';
import { CompaniesController } from './companies.controller.js';
import { ProviderSelfController } from './provider-self.controller.js';
import { ProviderApplicationsController } from './provider-applications.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      CompanyServiceEntity,
      CompanyServiceAreaEntity,
      CompanyGalleryPhotoEntity,
    ]),
  ],
  controllers: [
    CompaniesController,
    ProviderSelfController,
    ProviderApplicationsController,
  ],
  providers: [CompaniesService, GalleryService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
