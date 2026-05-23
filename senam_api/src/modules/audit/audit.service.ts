import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

export interface AuditWriteOptions {
  actorKind: 'admin' | 'system' | 'customer' | 'provider';
  actorId?: string;
  action: string;
  targetKind?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly dataSource: DataSource) {}

  async write(options: AuditWriteOptions, queryRunner?: QueryRunner): Promise<void> {
    const qr = queryRunner ?? this.dataSource.createQueryRunner();
    const owned = !queryRunner;

    try {
      if (owned) await qr.connect();

      await qr.query(
        `INSERT INTO audit_logs
          (actor_kind, actor_id, action, target_kind, target_id, "before", "after", reason, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          options.actorKind,
          options.actorId ?? null,
          options.action,
          options.targetKind ?? null,
          options.targetId ?? null,
          options.before ? JSON.stringify(options.before) : null,
          options.after ? JSON.stringify(options.after) : null,
          options.reason ?? null,
          options.correlationId ?? null,
        ],
      );
    } finally {
      if (owned) await qr.release();
    }
  }
}
