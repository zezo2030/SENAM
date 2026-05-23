import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity.js';
import { BookingsService } from './bookings.service.js';
import { BookingsController } from './bookings.controller.js';
import { StatusService } from './status.service.js';
import { CancelPolicyService } from './cancel-policy.service.js';
import { AssignmentController } from './assignment.controller.js';
import { ProviderInboxController } from './provider-inbox.controller.js';
import { SlotsModule } from '../slots/slots.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { CompanyUsersModule } from '../company-users/company-users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    SlotsModule,
    CouponsModule,
    PaymentsModule,
    CompanyUsersModule,
  ],
  controllers: [BookingsController, AssignmentController, ProviderInboxController],
  providers: [BookingsService, StatusService, CancelPolicyService],
  exports: [BookingsService, StatusService, CancelPolicyService],
})
export class BookingsModule {}
