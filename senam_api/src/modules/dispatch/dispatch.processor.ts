import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DispatchProducer } from '../../infrastructure/queue/producers/dispatch.producer.js';
import type { AcceptTimeoutJobData } from '../../infrastructure/queue/producers/dispatch.producer.js';
import { DispatchService } from './dispatch.service.js';

@Processor('dispatch')
export class DispatchProcessor {
  private readonly logger = new Logger(DispatchProcessor.name);
  private readonly dispatchTimeoutMs: number;
  private readonly dispatchMaxAttempts: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly dispatchProducer: DispatchProducer,
    private readonly configService: ConfigService,
    private readonly dispatchService: DispatchService,
  ) {
    this.dispatchTimeoutMs = this.configService.get<number>(
      'DISPATCH_ATTEMPT_TIMEOUT_MS',
      300000,
    );
    this.dispatchMaxAttempts = this.configService.get<number>(
      'DISPATCH_MAX_ATTEMPTS',
      3,
    );
  }

  @Process('accept-timeout')
  async handleAcceptTimeout(job: Job<AcceptTimeoutJobData>): Promise<void> {
    const { orderId, attempt } = job.data;

    this.logger.log(
      `Handling accept-timeout for order ${orderId}, attempt ${attempt}`,
    );

    // Atomically check order is still pending with matching dispatch_attempt and increment
    const result = await this.dataSource.query(
      `UPDATE orders SET dispatch_attempt = $1
       WHERE id = $2 AND status = 'pending' AND dispatch_attempt = $3
       RETURNING id, company_id, slot_id`,
      [attempt + 1, orderId, attempt],
    ) as Array<{ id: string; company_id: string; slot_id: string }>;

    if (!result.length) {
      // Already accepted, cancelled, or attempt mismatch — nothing to do
      this.logger.log(
        `Order ${orderId} no longer pending at attempt ${attempt}, skipping`,
      );
      return;
    }

    const currentCompanyId = result[0]!.company_id;

    // Update rejection_rate_pct for the previously-assigned company
    // (called before reassigning so we mark this as a rejection)
    try {
      await this.dataSource.query(
        `UPDATE companies
         SET rejection_rate_pct = (
           SELECT ROUND(
             100.0 * COUNT(*) FILTER (WHERE status IN ('unassignable', 'cancelled') AND company_id = $1)
             / NULLIF(COUNT(*) FILTER (WHERE company_id = $1), 0),
             2
           )
           FROM orders
         ),
         updated_at = now()
         WHERE id = $1`,
        [currentCompanyId],
      );
    } catch (err) {
      this.logger.warn(`Failed to update rejection_rate_pct for company ${currentCompanyId}`, err);
    }

    if (attempt >= this.dispatchMaxAttempts) {
      this.logger.warn(
        `Order ${orderId} exceeded max dispatch attempts (${this.dispatchMaxAttempts}), marking unassignable`,
      );
      await this.dispatchService.markUnassignable(orderId);
      return;
    }

    // Find the next-best provider: nearest active company different from the current one,
    // ordered by ST_Distance from company_service_areas centroid to order address.
    const nextProviders = await this.dataSource.query(
      `SELECT c.id AS company_id
       FROM companies c
       INNER JOIN company_service_areas csa ON csa.company_id = c.id
       WHERE c.status = 'active'
         AND c.id != $1
       ORDER BY ST_Distance(
         ST_Centroid(csa.area::geometry)::geography,
         (
           SELECT ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography
           FROM addresses a
           INNER JOIN orders o ON o.address_id = a.id
           WHERE o.id = $2
           LIMIT 1
         )
       ) ASC
       LIMIT 1`,
      [currentCompanyId, orderId],
    ) as Array<{ company_id: string }>;

    if (!nextProviders.length) {
      this.logger.warn(
        `No alternative provider found for order ${orderId}, marking unassignable`,
      );
      await this.dispatchService.markUnassignable(orderId);
      return;
    }

    const nextCompanyId = nextProviders[0]!.company_id;

    // Reassign the order to the next provider and write status history
    await this.dataSource.query(
      `UPDATE orders SET company_id = $1, updated_at = now() WHERE id = $2`,
      [nextCompanyId, orderId],
    );

    await this.dataSource.query(
      `INSERT INTO order_status_history
         (order_id, from_status, to_status, actor_kind, actor_id, reason)
       VALUES ($1, 'pending', 'pending', 'system', NULL, 'dispatch_reassigned')`,
      [orderId],
    );

    // Enqueue next accept-timeout timer
    this.logger.log(
      `Reassigned order ${orderId} to company ${nextCompanyId}, enqueuing attempt ${attempt + 1}`,
    );
    await this.dispatchProducer.enqueueAcceptTimeout(
      { orderId, attempt: attempt + 1 },
      this.dispatchTimeoutMs,
    );
  }
}
