import './bootstrap-env.js';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ObservabilityModule } from './infrastructure/observability/logger.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { RedisModule } from './infrastructure/cache/redis.module.js';
import { QueueModule } from './infrastructure/queue/queue.module.js';
import { MailModule } from './infrastructure/mail/mail.module.js';
import { StorageModule } from './infrastructure/storage/storage.module.js';
import { loadConfig } from './config/configuration.js';
import { validate } from './config/env.schema.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { CompanyUsersModule } from './modules/company-users/company-users.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { BannersModule } from './modules/banners/banners.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
      validate,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    ObservabilityModule,
    DatabaseModule,
    RedisModule,
    QueueModule.register(),
    MailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    AuditModule,
    HealthModule,
    CatalogModule,
    CompaniesModule,
    CompanyUsersModule,
    ReviewsModule,
    AdminModule,
    BannersModule,
    ReportsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
