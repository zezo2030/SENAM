import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_DISPATCH } from '../queue.constants.js';

export interface AcceptTimeoutJobData {
  orderId: string;
  attempt: number;
}

@Injectable()
export class DispatchProducer {
  constructor(@InjectQueue(QUEUE_DISPATCH) private readonly queue: Queue) {}

  async enqueueAcceptTimeout(data: AcceptTimeoutJobData, delayMs: number): Promise<void> {
    await this.queue.add('accept-timeout', data, {
      jobId: `accept-timeout:${data.orderId}:${data.attempt}`,
      delay: delayMs,
      attempts: 1,
    });
  }

  async removeAcceptTimeout(orderId: string, attempt: number): Promise<void> {
    const job = await this.queue.getJob(`accept-timeout:${orderId}:${attempt}`);
    if (job) {
      await job.remove();
    }
  }
}
