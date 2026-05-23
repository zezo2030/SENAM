import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class RatingAggregatorService {
  constructor(private readonly dataSource: DataSource) {}

  async recomputeCompanyRating(companyId: string, qr?: QueryRunner): Promise<void> {
    const ownQr = !qr;
    const runner = qr ?? this.dataSource.createQueryRunner();

    try {
      if (ownQr) await runner.connect();

      await runner.query(
        `UPDATE companies
         SET rating_avg = COALESCE((SELECT AVG(rating_company) FROM reviews WHERE company_id = $1), 0),
             rating_count = (SELECT COUNT(*) FROM reviews WHERE company_id = $1)
         WHERE id = $1`,
        [companyId],
      );
    } finally {
      if (ownQr) await runner.release();
    }
  }

  async recomputeStaffRating(staffId: string, qr?: QueryRunner): Promise<void> {
    const ownQr = !qr;
    const runner = qr ?? this.dataSource.createQueryRunner();

    try {
      if (ownQr) await runner.connect();

      await runner.query(
        `UPDATE company_users
         SET rating_avg = COALESCE((SELECT AVG(rating_staff) FROM reviews WHERE staff_id = $1 AND rating_staff IS NOT NULL), 0),
             rating_count = (SELECT COUNT(*) FROM reviews WHERE staff_id = $1 AND rating_staff IS NOT NULL)
         WHERE id = $1`,
        [staffId],
      );
    } finally {
      if (ownQr) await runner.release();
    }
  }
}
