import { Injectable, Logger } from '@nestjs/common';
import type { NotificationJobData } from './notifications.producer.js';

@Injectable()
export class NotificationsProducerDev {
  private readonly logger = new Logger(NotificationsProducerDev.name);

  async enqueue(data: NotificationJobData): Promise<void> {
    this.logger.warn(`Redis disabled: skipped notification job topic=${data.topic}`);
  }
}
