import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DirectoryByDay {
  date: string;
  registrations: number;
  reviews: number;
}

export interface DirectoryReport {
  from: string;
  to: string;
  totalCompanies: number;
  activeCompanies: number;
  pendingCompanies: number;
  totalReviews: number;
  byDay: DirectoryByDay[];
}

/**
 * Directory metrics: company counts by status, plus daily new
 * registrations and review submissions. Replaces the sales report
 * that existed when SENAM was a full marketplace.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async directoryReport(from: Date, to: Date): Promise<DirectoryReport> {
    const statusCounts = await this.dataSource.query<
      Array<{ status: string; count: string }>
    >(`SELECT status, COUNT(*) AS count FROM companies GROUP BY status`);

    let totalCompanies = 0;
    let activeCompanies = 0;
    let pendingCompanies = 0;
    for (const row of statusCounts) {
      const n = parseInt(row.count, 10);
      totalCompanies += n;
      if (row.status === 'active') activeCompanies = n;
      if (row.status === 'pending') pendingCompanies = n;
    }

    const reviewsRow = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM reviews`,
    );
    const totalReviews = parseInt(reviewsRow[0]?.count ?? '0', 10);

    const regRows = await this.dataSource.query<
      Array<{ day: Date; count: string }>
    >(
      `SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Qatar') AS day,
              COUNT(*) AS count
         FROM companies
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY 1
        ORDER BY 1`,
      [from, to],
    );

    const reviewRows = await this.dataSource.query<
      Array<{ day: Date; count: string }>
    >(
      `SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Qatar') AS day,
              COUNT(*) AS count
         FROM reviews
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY 1
        ORDER BY 1`,
      [from, to],
    );

    const dayMap = new Map<string, DirectoryByDay>();
    const toKey = (d: Date | string) =>
      (d instanceof Date ? d.toISOString() : String(d)).split('T')[0]!;
    for (const r of regRows) {
      const k = toKey(r.day);
      const existing = dayMap.get(k) ?? { date: k, registrations: 0, reviews: 0 };
      existing.registrations = parseInt(r.count, 10);
      dayMap.set(k, existing);
    }
    for (const r of reviewRows) {
      const k = toKey(r.day);
      const existing = dayMap.get(k) ?? { date: k, registrations: 0, reviews: 0 };
      existing.reviews = parseInt(r.count, 10);
      dayMap.set(k, existing);
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      totalReviews,
      byDay: [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
