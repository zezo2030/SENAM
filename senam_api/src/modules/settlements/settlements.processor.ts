import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { SettlementsService } from './settlements.service.js';
import type { SettlementComputeJobData } from '../../infrastructure/queue/producers/settlements.producer.js';

@Processor('settlements')
export class SettlementsProcessor {
  private readonly logger = new Logger(SettlementsProcessor.name);

  constructor(private readonly settlementsService: SettlementsService) {}

  @Process('settlement-compute')
  async handleCompute(job: Job<SettlementComputeJobData>): Promise<void> {
    const { companyId, windowStart } = job.data;

    this.logger.log(
      `Processing settlement for company ${companyId}, window ${windowStart}`,
    );

    const result = await this.settlementsService.computeWindow(
      companyId,
      new Date(windowStart),
    );

    if (result.alreadyExisted) {
      this.logger.log(
        `Settlement already existed for company ${companyId}, window ${windowStart}`,
      );
    } else {
      this.logger.log(
        `Settlement ${result.settlementId} created: net_amount=${result.netAmount} status=${result.status}`,
      );
    }
  }
}
