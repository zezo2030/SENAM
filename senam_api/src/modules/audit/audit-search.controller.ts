import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('admin-audit')
@ApiBearerAuth()
@Controller('admin/audit')
export class AuditSearchController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @Roles('super_admin', 'ops_admin', 'finance_admin', 'support_admin')
  @ApiOperation({ summary: 'Search audit logs' })
  @ApiQuery({ name: 'targetKind', required: false })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async searchAuditLogs(
    @Query('targetKind') targetKind?: string,
    @Query('targetId') targetId?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (targetKind) {
      params.push(targetKind);
      conditions.push(`target_kind = $${params.length}`);
    }
    if (targetId) {
      params.push(targetId);
      conditions.push(`target_id = $${params.length}`);
    }
    if (actorId) {
      params.push(actorId);
      conditions.push(`actor_id = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`at >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`at <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM audit_logs ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    params.push(limit);
    params.push(offset);

    const data = await this.dataSource.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { data, total, page, limit };
  }
}
