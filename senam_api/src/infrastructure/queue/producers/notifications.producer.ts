import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_NOTIFICATIONS } from '../queue.constants.js';

export interface NotificationJobData {
  userKind: 'customer' | 'company_user' | 'admin';
  userId: string;
  topic: string;
  payload: Record<string, unknown>;
  channels: ('push' | 'in_app' | 'email')[];
}

@Injectable()
export class NotificationsProducer {
  constructor(@InjectQueue(QUEUE_NOTIFICATIONS) private readonly queue: Queue) {}

  async enqueue(data: NotificationJobData): Promise<void> {
    await this.queue.add('send-notification', data, { attempts: 3, backoff: { type: 'exponential', delay: 500 } });
  }
}
