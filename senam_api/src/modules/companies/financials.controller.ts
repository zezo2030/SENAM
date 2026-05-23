import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { DataSource } from 'typeorm';

class FinancialsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

@ApiTags('provider-financials')
@ApiBearerAuth()
@Roles('provider_owner')
@Controller('provider/me/financials')
export class FinancialsController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: "Get aggregated financials (commission accruals) for the provider's company" })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  async getFinancials(
    @CurrentUser() user: JwtPayload,
    @Query() query: FinancialsQueryDto,
  ) {
    const companyId = user.companyId!;
    const params: unknown[] = [companyId];
    const whereClauses: string[] = ['ca.company_id = $1'];

    if (query.from) {
      params.push(query.from);
      whereClauses.push(`ca.created_at >= $${params.length}`);
    }
    if (query.to) {
      params.push(query.to);
      whereClauses.push(`ca.created_at <= $${params.length}`);
    }

    const whereStr = whereClauses.join(' AND ');

    // Detailed accrual rows
    const accruals = await this.dataSource.query(
      `SELECT
         ca.id,
         ca.order_id,
         ca.kind,
         ca.gross_amount,
         ca.commission_amount,
         ca.settlement_id,
         ca.created_at,
         o.status AS order_status
       FROM commission_accruals ca
       JOIN orders o ON o.id = ca.order_id
       WHERE ${whereStr}
       ORDER BY ca.created_at DESC`,
      params,
    ) as unknown[];

    // Aggregated totals by kind
    const byKind = await this.dataSource.query(
      `SELECT
         ca.kind,
         COALESCE(SUM(ca.gross_amount), 0)::TEXT        AS gross_amount,
         COALESCE(SUM(ca.commission_amount), 0)::TEXT   AS commission_amount,
         COUNT(*)::INT                                   AS order_count
       FROM commission_accruals ca
       WHERE ${whereStr}
       GROUP BY ca.kind
       ORDER BY ca.kind`,
      params,
    ) as Array<{ kind: string; gross_amount: string; commission_amount: string; order_count: number }>;

    // Grand totals
    const totals = await this.dataSource.query(
      `SELECT
         COALESCE(SUM(ca.gross_amount), 0)::TEXT        AS total_gross_amount,
         COALESCE(SUM(ca.commission_amount), 0)::TEXT   AS total_commission_amount,
         COUNT(*)::INT                                   AS total_order_count,
         COALESCE(SUM(CASE WHEN ca.settlement_id IS NULL THEN ca.gross_amount ELSE 0 END), 0)::TEXT
           AS unsettled_gross_amount,
         COALESCE(SUM(CASE WHEN ca.settlement_id IS NULL THEN ca.commission_amount ELSE 0 END), 0)::TEXT
           AS unsettled_commission_amount
       FROM commission_accruals ca
       WHERE ${whereStr}`,
      params,
    ) as Array<{
      total_gross_amount: string;
      total_commission_amount: string;
      total_order_count: number;
      unsettled_gross_amount: string;
      unsettled_commission_amount: string;
    }>;

    const total = totals[0]!;

    return {
      companyId,
      from: query.from ?? null,
      to: query.to ?? null,
      totalGrossAmount: total.total_gross_amount,
      totalCommissionAmount: total.total_commission_amount,
      totalOrderCount: total.total_order_count,
      unsettledGrossAmount: total.unsettled_gross_amount,
      unsettledCommissionAmount: total.unsettled_commission_amount,
      byKind,
      accruals,
    };
  }
}
