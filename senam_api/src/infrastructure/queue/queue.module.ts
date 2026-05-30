import { DynamicModule, Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { isRedisEnabledFromEnv } from '../../config/redis-enabled.js';
import { MailModule } from '../mail/mail.module.js';
import { MailProducer } from './producers/mail.producer.js';
import { NotificationsProducer } from './producers/notifications.producer.js';
import { MailProducerDev } from './producers/mail.producer.dev.js';
import { NotificationsProducerDev } from './producers/notifications.producer.dev.js';
import { QUEUE_MAIL, QUEUE_NOTIFICATIONS } from './queue.constants.js';

export { QUEUE_MAIL, QUEUE_NOTIFICATIONS } from './queue.constants.js';

const producerExports = [MailProducer, NotificationsProducer] as const;

@Global()
@Module({})
export class QueueModule {
  static register(): DynamicModule {
    if (!isRedisEnabledFromEnv()) {
      return {
        module: QueueModule,
        imports: [MailModule],
        providers: [
          { provide: MailProducer, useClass: MailProducerDev },
          { provide: NotificationsProducer, useClass: NotificationsProducerDev },
        ],
        exports: [...producerExports],
      };
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            redis: config.get<string>('REDIS_URL')!,
          }),
        }),
        BullModule.registerQueue(
          { name: QUEUE_MAIL },
          { name: QUEUE_NOTIFICATIONS },
        ),
      ],
      providers: [...producerExports],
      exports: [BullModule, ...producerExports],
    };
  }
}
