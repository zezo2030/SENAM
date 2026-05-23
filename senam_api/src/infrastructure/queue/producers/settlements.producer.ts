import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_SETTLEMENTS } from '../queue.constants.js';

export interface SettlementComputeJobData {
  companyId: string;
  windowStart: string;
}

@Injectable()
export class SettlementsProducer {
  constructor(@InjectQueue(QUEUE_SETTLEMENTS) private readonly queue: Queue) {}

  async enqueueCompute(data: SettlementComputeJobData): Promise<void> {
    await this.queue.add('settlement-compute', data, {
      jobId: `settlement:${data.companyId}:${data.windowStart}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
