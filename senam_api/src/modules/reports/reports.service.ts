import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SalesByDay {
  date: string;
  orders: number;
  revenue: string;
  commission: string;
}

export interface SalesReport {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: string;
  totalCommission: string;
  byDay: SalesByDay[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async salesReport(
    from: Date,
    to: Date,
    categoryId?: string,
  ): Promise<SalesReport> {
    const params: unknown[] = [from, to];

    let categoryFilter = '';
    if (categoryId) {
      params.push(categoryId);
      categoryFilter = `AND o.company_id IN (
        SELECT cs.company_id
        FROM company_services cs
        JOIN services s ON s.id = cs.service_id
        WHERE s.category_id = $${params.length}
      )`;
    }

    const rows = await this.dataSource.query<Array<{
      day: Date;
      order_count: string;
      revenue: string;
      commission: string;
    }>>(
      `SELECT
         date_trunc('day', o.completed_at AT TIME ZONE 'Asia/Qatar') AS day,
         COUNT(o.id) AS order_count,
         SUM(o.total) AS revenue,
         SUM(ca.commission_amount) AS commission
       FROM orders o
       LEFT JOIN commission_accruals ca ON ca.order_id = o.id
       WHERE o.status = 'completed'
         AND o.completed_at BETWEEN $1 AND $2
         ${categoryFilter}
       GROUP BY 1
       ORDER BY 1`,
      params,
    );

    const byDay: SalesByDay[] = rows.map(r => ({
      date: r.day instanceof Date ? r.day.toISOString().split('T')[0]! : String(r.day).split('T')[0]!,
      orders: parseInt(r.order_count, 10),
      revenue: r.revenue ?? '0',
      commission: r.commission ?? '0',
    }));

    const totalOrders = byDay.reduce((s, r) => s + r.orders, 0);
    const totalRevenueBigInt = rows.reduce((s, r) => s + BigInt(r.revenue ?? '0'), BigInt(0));
    const totalCommissionBigInt = rows.reduce((s, r) => s + BigInt(r.commission ?? '0'), BigInt(0));

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalOrders,
      totalRevenue: totalRevenueBigInt.toString(),
      totalCommission: totalCommissionBigInt.toString(),
      byDay,
    };
  }
}
