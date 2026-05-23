import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { isRedisEnabledFromEnv } from '../../config/redis-enabled.js';
import { DispatchProcessor } from './dispatch.processor.js';
import { DispatchService } from './dispatch.service.js';
import { PaymentsModule } from '../payments/payments.module.js';

const redisEnabled = isRedisEnabledFromEnv();

/**
 * DispatchModule registers the BullMQ processor for the 'dispatch' queue.
 * The queue itself is already registered globally via QueueModule, but
 * @nestjs/bull requires a local BullModule.registerQueue to bind the
 * @Processor decorator to the queue in this module's context.
 */
@Module({
  imports: [
    ...(redisEnabled ? [BullModule.registerQueue({ name: 'dispatch' })] : []),
    PaymentsModule,
  ],
  providers: [...(redisEnabled ? [DispatchProcessor] : []), DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
