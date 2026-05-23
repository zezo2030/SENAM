import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from '../companies/entities/company.entity.js';
import { OrderEntity } from '../bookings/entities/order.entity.js';
import { CouponEntity } from '../coupons/entities/coupon.entity.js';
import { CategoryEntity } from '../catalog/entities/category.entity.js';
import { ServiceEntity } from '../catalog/entities/service.entity.js';
import { BannerEntity } from '../banners/entities/banner.entity.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { AdminService } from './admin.service.js';
import { CompaniesAdminController } from './companies.admin.controller.js';
import { OrdersAdminController } from './orders.admin.controller.js';
import { CouponsAdminController } from './coupons.admin.controller.js';
import { CatalogAdminController } from './catalog.admin.controller.js';
import { BannersAdminController } from './banners.admin.controller.js';
import { UsersAdminController } from './users.admin.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      OrderEntity,
      CouponEntity,
      CategoryEntity,
      ServiceEntity,
      BannerEntity,
    ]),
    PaymentsModule,
    CompaniesModule,
  ],
  controllers: [
    CompaniesAdminController,
    OrdersAdminController,
    CouponsAdminController,
    CatalogAdminController,
    BannersAdminController,
    UsersAdminController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
