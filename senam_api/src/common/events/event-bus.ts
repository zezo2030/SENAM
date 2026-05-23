import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { isRedisEnabled } from '../../config/redis-enabled.js';
import { REDIS_CLIENT } from '../../infrastructure/cache/redis.constants.js';

export const ORDER_STATUS_CHANGED = 'order.status_changed';

export interface OrderStatusChangedEvent {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  customerId: string;
  companyId: string;
  assignedStaffId?: string | null;
}

@Injectable()
export class EventBusService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private subscriber: Redis | null = null;
  private readonly redisEnabled: boolean;

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly publisher: Redis | null,
    private readonly configService: ConfigService,
  ) {
    super();
    this.redisEnabled = isRedisEnabled(configService);
    if (this.redisEnabled) {
      this.subscriber = new Redis(this.configService.get<string>('REDIS_URL')!);
      this.subscriber.on('error', (err) => {
        console.error('[EventBus] subscriber error', err);
      });
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.redisEnabled || !this.subscriber) {
      return;
    }
    await this.subscriber.subscribe('events.order');
    this.subscriber.on('message', (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as OrderStatusChangedEvent;
        super.emit(ORDER_STATUS_CHANGED, event);
      } catch (err) {
        console.error('[EventBus] failed to parse message', err);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe('events.order');
      this.subscriber.disconnect();
    }
    this.removeAllListeners();
  }

  publishOrderStatusChanged(event: OrderStatusChangedEvent): void {
    if (!this.redisEnabled || !this.publisher) {
      super.emit(ORDER_STATUS_CHANGED, event);
      return;
    }
    this.publisher.publish('events.order', JSON.stringify(event));
  }
}
