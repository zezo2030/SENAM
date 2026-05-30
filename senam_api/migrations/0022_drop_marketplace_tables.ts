import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SENAM is now a directory/middleman app — no orders, payments, dispatch,
 * slots, coupons, or settlements flow through the platform.
 *
 * Drops every table that powered the marketplace flow, in FK-safe order.
 * The drop is irreversible: there is no `down()` that recreates the
 * marketplace; older migrations (0005–0008, 0012) still exist if anyone
 * needs to bootstrap a fresh marketplace DB for archival purposes.
 */
export class DropMarketplaceTables0022 implements MigrationInterface {
  name = 'DropMarketplaceTables0022';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop in FK-safe order: leaves first, roots last.
    const drops = [
      // settlement chain
      'settlement_lines',
      'settlements',
      // payments chain
      'refunds',
      'commission_accruals',
      'payments',
      // orders chain
      'order_status_history',
      'orders',
      // slots
      'time_slots',
      'slot_templates',
      // coupons (referenced by orders, so dropped after)
      'coupons',
    ];
    for (const t of drops) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    }
  }

  async down(): Promise<void> {
    // No-op: marketplace is gone. Re-bootstrapping requires re-running the
    // original 0005–0008 + 0012 migrations on a fresh database.
  }
}
