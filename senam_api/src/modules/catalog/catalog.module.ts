import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity.js';
import { ServiceEntity } from './entities/service.entity.js';
import { CompanyEntity } from '../companies/entities/company.entity.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { ServicesService } from './services.service.js';
import { ServicesController } from './services.controller.js';
import { SearchService } from './search.service.js';
import { SearchController } from './search.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      ServiceEntity,
      CompanyEntity,
    ]),
  ],
  controllers: [
    CategoriesController,
    ServicesController,
    SearchController,
  ],
  providers: [
    CategoriesService,
    ServicesService,
    SearchService,
  ],
  exports: [CategoriesService, ServicesService, SearchService],
})
export class CatalogModule {}
