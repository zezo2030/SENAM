import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_MAIL } from '../queue.constants.js';

export interface SendOtpJobData {
  email: string;
  code: string;
  locale: string;
}

export interface SendTransactionalJobData {
  email: string;
  template: string;
  vars: Record<string, unknown>;
  locale: string;
}

@Injectable()
export class MailProducer {
  constructor(@InjectQueue(QUEUE_MAIL) private readonly queue: Queue) {}

  async enqueueOtp(data: SendOtpJobData): Promise<void> {
    await this.queue.add('send-otp', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }

  async enqueueTransactional(data: SendTransactionalJobData): Promise<void> {
    await this.queue.add('send-transactional', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }
}
