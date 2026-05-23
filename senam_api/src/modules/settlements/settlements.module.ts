import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { isRedisEnabledFromEnv } from '../../config/redis-enabled.js';

const redisEnabled = isRedisEnabledFromEnv();
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementEntity } from './entities/settlement.entity.js';
import { SettlementLineEntity } from './entities/settlement-line.entity.js';
import { SettlementsService } from './settlements.service.js';
import { SettlementsProcessor } from './settlements.processor.js';
import { SettlementsScheduler } from './settlements.scheduler.js';
import { StatementService } from './statement.service.js';
import { ProviderSettlementsController } from './provider-settlements.controller.js';
import { AdminSettlementsController } from './admin-settlements.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    ...(redisEnabled ? [BullModule.registerQueue({ name: 'settlements' })] : []),
    TypeOrmModule.forFeature([SettlementEntity, SettlementLineEntity]),
    AuditModule,
  ],
  controllers: [ProviderSettlementsController, AdminSettlementsController],
  providers: [
    SettlementsService,
    ...(redisEnabled ? [SettlementsProcessor] : []),
    SettlementsScheduler,
    StatementService,
  ],
  exports: [SettlementsService],
})
export class SettlementsModule {}
