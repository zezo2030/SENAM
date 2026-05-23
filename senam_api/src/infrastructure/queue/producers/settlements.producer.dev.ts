import { Injectable, Logger } from '@nestjs/common';
import type { SettlementComputeJobData } from './settlements.producer.js';

@Injectable()
export class SettlementsProducerDev {
  private readonly logger = new Logger(SettlementsProducerDev.name);

  async enqueueCompute(data: SettlementComputeJobData): Promise<void> {
    this.logger.warn(
      `Redis disabled: skipped settlement-compute for company ${data.companyId}`,
    );
  }
}
