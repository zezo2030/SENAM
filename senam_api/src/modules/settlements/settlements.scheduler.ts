import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SettlementsProducer } from '../../infrastructure/queue/producers/settlements.producer.js';

@Injectable()
export class SettlementsScheduler implements OnModuleInit {
  private readonly logger = new Logger(SettlementsScheduler.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly settlementsProducer: SettlementsProducer,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'SETTLEMENT_CRON',
      '0 30 0 * * 0',
    );

    const job = new CronJob(
      cronExpression,
      () => {
        void this.triggerWeeklySettlements();
      },
      null,
      true,
      'Asia/Qatar',
    );

    this.schedulerRegistry.addCronJob('settlements-weekly', job);
    this.logger.log(`Settlements cron registered: "${cronExpression}" (Asia/Qatar)`);
  }

  /**
   * Computes window boundaries for the just-closed week (in Asia/Qatar time),
   * then enqueues a settlement-compute job for every active company.
   *
   * When this fires at Sunday 00:30 Asia/Qatar, the closed window is:
   *   windowStart: previous Sunday 00:00 Asia/Qatar (= Saturday 21:00 UTC)
   *   windowEnd:   current Sunday 00:00 Asia/Qatar  (= Saturday 21:00 UTC + 7 days)
   */
  async triggerWeeklySettlements(): Promise<void> {
    this.logger.log('Starting weekly settlement computation');

    const { windowStart, windowEnd } = this.getClosedWindowBounds();

    this.logger.log(
      `Settlement window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`,
    );

    let companies: Array<{ id: string }>;
    try {
      companies = await this.dataSource.query<Array<{ id: string }>>(
        `SELECT id FROM companies WHERE status = 'active'`,
      );
    } catch (err) {
      this.logger.error('Failed to fetch active companies for settlement', err);
      return;
    }

    this.logger.log(
      `Enqueuing settlement jobs for ${companies.length} active companies`,
    );

    for (const company of companies) {
      try {
        await this.settlementsProducer.enqueueCompute({
          companyId: company.id,
          windowStart: windowStart.toISOString(),
        });
      } catch (err) {
        this.logger.error(
          `Failed to enqueue settlement job for company ${company.id}`,
          err,
        );
      }
    }

    this.logger.log('Weekly settlement jobs enqueued');
  }

  /** Returns the closed window boundaries relative to the current time. */
  private getClosedWindowBounds(): { windowStart: Date; windowEnd: Date } {
    const now = new Date();
    // Qatar is UTC+3 — shift local "now" to Qatar perspective
    const qatarOffsetMs = 3 * 3600 * 1000;
    const nowQatar = new Date(now.getTime() + qatarOffsetMs);

    // Current Sunday midnight in Qatar (date components from Qatar-shifted time)
    const qatarMidnightUtc = Date.UTC(
      nowQatar.getUTCFullYear(),
      nowQatar.getUTCMonth(),
      nowQatar.getUTCDate(),
      0, 0, 0, 0,
    );
    // Convert Qatar midnight back to actual UTC
    const windowEnd = new Date(qatarMidnightUtc - qatarOffsetMs);
    const windowStart = new Date(windowEnd.getTime() - 7 * 24 * 3600 * 1000);

    return { windowStart, windowEnd };
  }
}
