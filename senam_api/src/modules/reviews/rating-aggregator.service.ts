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
}
