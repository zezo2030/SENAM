import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { toStoredMediaPath } from '../../common/utils/media-url.util.js';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsProducer } from '../../infrastructure/queue/producers/notifications.producer.js';
import { SuspendCompanyDto } from './dto/suspend-company.dto.js';
import { ResetCompanyPasswordDto } from './dto/reset-company-password.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

const PASSWORD_BCRYPT_ROUNDS = 12;

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function rowToCamel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v;
  }
  return out;
}

function rowsToCamel<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(rowToCamel);
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly notificationsProducer: NotificationsProducer,
  ) {}

  // ─── Companies ─────────────────────────────────────────────────────────

  async listCompanies(filter: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    let whereClause = '';

    if (filter.status) {
      params.push(filter.status);
      whereClause = `WHERE status = $${params.length}`;
    }

    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM companies ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    params.push(limit);
    params.push(offset);

    const data = await this.dataSource.query(
      `SELECT
          id,
          legal_name                  AS "legalName",
          display_name                AS "displayName",
          slug,
          description,
          logo_object_key             AS "logoObjectKey",
          cover_object_key            AS "coverObjectKey",
          phone,
          email,
          website,
          instagram,
          landline,
          whatsapp_link               AS "whatsappLink",
          region,
          city,
          latitude,
          longitude,
          map_url                     AS "mapUrl",
          category_id                 AS "categoryId",
          has_commercial_registration AS "hasCommercialRegistration",
          commercial_registration_no  AS "commercialRegistrationNo",
          custom_service_text         AS "customServiceText",
          additional_notes            AS "additionalNotes",
          subscription_plan           AS "subscriptionPlan",
          subscription_period         AS "subscriptionPeriod",
          subscription_price          AS "subscriptionPrice",
          status,
          kyc_approved_by             AS "kycApprovedBy",
          kyc_approved_at             AS "kycApprovedAt",
          rating_avg                  AS "ratingAvg",
          rating_count                AS "ratingCount",
          created_at                  AS "createdAt",
          updated_at                  AS "updatedAt"
        FROM companies ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { data, total, page, limit };
  }

  async approveCompany(
    id: string,
    adminId: string,
    _correlationId?: string,
  ): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE companies
         SET status = 'active', kyc_approved_by = $1, kyc_approved_at = now()
       WHERE id = $2 AND status = 'pending'
       RETURNING id`,
      [adminId, id],
    );

    if (!result.length) {
      throw new ConflictException('company_not_pending_or_not_found');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'company.approve',
      targetKind: 'company',
      targetId: id,
      after: { status: 'active' },
    });

    const owners = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM company_users WHERE company_id = $1 AND role = 'owner'`,
      [id],
    );
    for (const owner of owners) {
      await this.dataSource.query(
        `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
         VALUES ('company_user', $1, 'company.approved', $2, ARRAY['in_app','push','email'], 'pending')`,
        [owner.id, JSON.stringify({ companyId: id })],
      );
      await this.notificationsProducer.enqueue({
        userKind: 'company_user',
        userId: owner.id,
        topic: 'company.approved',
        payload: { companyId: id },
        channels: ['push', 'in_app', 'email'],
      });
    }
  }

  async suspendCompany(
    id: string,
    adminId: string,
    dto: SuspendCompanyDto,
    _correlationId?: string,
  ): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE companies SET status = 'suspended' WHERE id = $1 AND status != 'suspended' RETURNING id`,
      [id],
    );

    if (!result.length) {
      throw new ConflictException('company_not_found_or_already_suspended');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'company.suspend',
      targetKind: 'company',
      targetId: id,
      after: { status: 'suspended' },
      reason: dto.reason,
    });

    const owners = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM company_users WHERE company_id = $1 AND role = 'owner'`,
      [id],
    );
    for (const owner of owners) {
      await this.dataSource.query(
        `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
         VALUES ('company_user', $1, 'company.suspended', $2, ARRAY['in_app','push','email'], 'pending')`,
        [owner.id, JSON.stringify({ companyId: id, reason: dto.reason })],
      );
      await this.notificationsProducer.enqueue({
        userKind: 'company_user',
        userId: owner.id,
        topic: 'company.suspended',
        payload: { companyId: id, reason: dto.reason },
        channels: ['push', 'in_app', 'email'],
      });
    }
  }

  async resetCompanyPassword(
    companyId: string,
    dto: ResetCompanyPasswordDto,
    adminId: string,
  ): Promise<{ updatedCount: number; emails: string[] }> {
    const company = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM companies WHERE id = $1`,
      [companyId],
    );
    if (!company.length) {
      throw new NotFoundException('company_not_found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, PASSWORD_BCRYPT_ROUNDS);

    const updated = await this.dataSource.query<Array<{ id: string; email: string }>>(
      `UPDATE company_users
       SET password_hash = $1, updated_at = now()
       WHERE company_id = $2 AND role = 'owner'
       RETURNING id, email`,
      [passwordHash, companyId],
    );

    if (!updated.length) {
      throw new NotFoundException('company_owner_not_found');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'company.reset_password',
      targetKind: 'company',
      targetId: companyId,
      after: { ownerIds: updated.map((u) => u.id) },
    });

    return {
      updatedCount: updated.length,
      emails: updated.map((u) => u.email),
    };
  }

  // ─── Categories ────────────────────────────────────────────────────────

  async listCategories(): Promise<unknown[]> {
    const rows = await this.dataSource.query<Record<string, unknown>[]>(
      `SELECT * FROM categories ORDER BY sort_order ASC, name_ar ASC`,
    );
    return rowsToCamel(rows);
  }

  async createCategory(dto: CreateCategoryDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO categories (slug, name_ar, name_en, icon_key, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        dto.slug,
        dto.nameAr,
        dto.nameEn ?? null,
        dto.iconKey ? toStoredMediaPath(dto.iconKey) : null,
        dto.sortOrder ?? 0,
        dto.isActive ?? true,
      ],
    );

    const category = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'category.create',
      targetKind: 'category',
      targetId: category.id,
      after: category,
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.slug !== undefined) { params.push(dto.slug); sets.push(`slug = $${params.length}`); }
    if (dto.nameAr !== undefined) { params.push(dto.nameAr); sets.push(`name_ar = $${params.length}`); }
    if (dto.nameEn !== undefined) { params.push(dto.nameEn); sets.push(`name_en = $${params.length}`); }
    if (dto.iconKey !== undefined) {
      params.push(dto.iconKey ? toStoredMediaPath(dto.iconKey) : null);
      sets.push(`icon_key = $${params.length}`);
    }
    if (dto.sortOrder !== undefined) { params.push(dto.sortOrder); sets.push(`sort_order = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('category_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'category.update',
      targetKind: 'category',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteCategory(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE categories SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('category_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'category.delete',
      targetKind: 'category',
      targetId: id,
      after: { isActive: false },
    });
  }

  // ─── Services ──────────────────────────────────────────────────────────

  async listServices(categoryId?: string): Promise<unknown[]> {
    const baseSql = `
      SELECT
        s.id,
        s.category_id,
        s.slug,
        s.name_ar,
        s.name_en,
        s.description_ar,
        s.description_en,
        s.icon_key,
        s.image_key,
        s.is_active,
        c.name_ar AS category_name_ar,
        c.name_en AS category_name_en
      FROM services s
      LEFT JOIN categories c ON c.id = s.category_id`;
    const rows = categoryId
      ? await this.dataSource.query<Record<string, unknown>[]>(
          `${baseSql} WHERE s.category_id = $1 ORDER BY s.name_ar ASC`,
          [categoryId],
        )
      : await this.dataSource.query<Record<string, unknown>[]>(
          `${baseSql} ORDER BY s.name_ar ASC`,
        );
    return rowsToCamel(rows);
  }

  async createService(dto: CreateServiceDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO services
         (category_id, slug, name_ar, name_en, description_ar, description_en, icon_key, image_key, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        dto.categoryId,
        dto.slug,
        dto.nameAr,
        dto.nameEn ?? null,
        dto.descriptionAr ?? null,
        dto.descriptionEn ?? null,
        dto.iconKey ? toStoredMediaPath(dto.iconKey) : null,
        dto.imageKey ? toStoredMediaPath(dto.imageKey) : null,
        dto.isActive ?? true,
      ],
    );

    const service = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'service.create',
      targetKind: 'service',
      targetId: service.id,
      after: service,
    });

    return service;
  }

  async updateService(id: string, dto: UpdateServiceDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.categoryId !== undefined) { params.push(dto.categoryId); sets.push(`category_id = $${params.length}`); }
    if (dto.slug !== undefined) { params.push(dto.slug); sets.push(`slug = $${params.length}`); }
    if (dto.nameAr !== undefined) { params.push(dto.nameAr); sets.push(`name_ar = $${params.length}`); }
    if (dto.nameEn !== undefined) { params.push(dto.nameEn); sets.push(`name_en = $${params.length}`); }
    if (dto.descriptionAr !== undefined) { params.push(dto.descriptionAr); sets.push(`description_ar = $${params.length}`); }
    if (dto.descriptionEn !== undefined) { params.push(dto.descriptionEn); sets.push(`description_en = $${params.length}`); }
    if (dto.iconKey !== undefined) {
      params.push(dto.iconKey ? toStoredMediaPath(dto.iconKey) : null);
      sets.push(`icon_key = $${params.length}`);
    }
    if (dto.imageKey !== undefined) {
      params.push(dto.imageKey ? toStoredMediaPath(dto.imageKey) : null);
      sets.push(`image_key = $${params.length}`);
    }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE services SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('service_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'service.update',
      targetKind: 'service',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteService(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE services SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('service_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'service.delete',
      targetKind: 'service',
      targetId: id,
      after: { isActive: false },
    });
  }

  // ─── Banners ───────────────────────────────────────────────────────────

  async listBanners(): Promise<unknown[]> {
    return this.dataSource.query(
      `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`,
    );
  }

  async createBanner(dto: CreateBannerDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO banners
         (title_ar, title_en, subtitle_ar, subtitle_en, image_url, link_url,
          target_type, target_id, sort_order, is_active, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        dto.titleAr,
        dto.titleEn ?? null,
        dto.subtitleAr ?? null,
        dto.subtitleEn ?? null,
        toStoredMediaPath(dto.imageUrl),
        dto.linkUrl ?? null,
        dto.targetType ?? null,
        dto.targetId ?? null,
        dto.sortOrder ?? 0,
        dto.isActive ?? true,
        dto.startsAt ?? null,
        dto.endsAt ?? null,
      ],
    );

    const banner = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'banner.create',
      targetKind: 'banner',
      targetId: banner.id,
      after: banner,
    });

    return banner;
  }

  async updateBanner(id: string, dto: UpdateBannerDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.titleAr !== undefined) { params.push(dto.titleAr); sets.push(`title_ar = $${params.length}`); }
    if (dto.titleEn !== undefined) { params.push(dto.titleEn); sets.push(`title_en = $${params.length}`); }
    if (dto.subtitleAr !== undefined) { params.push(dto.subtitleAr); sets.push(`subtitle_ar = $${params.length}`); }
    if (dto.subtitleEn !== undefined) { params.push(dto.subtitleEn); sets.push(`subtitle_en = $${params.length}`); }
    if (dto.imageUrl !== undefined) {
      params.push(toStoredMediaPath(dto.imageUrl));
      sets.push(`image_url = $${params.length}`);
    }
    if (dto.linkUrl !== undefined) { params.push(dto.linkUrl); sets.push(`link_url = $${params.length}`); }
    if (dto.targetType !== undefined) { params.push(dto.targetType); sets.push(`target_type = $${params.length}`); }
    if (dto.targetId !== undefined) { params.push(dto.targetId); sets.push(`target_id = $${params.length}`); }
    if (dto.sortOrder !== undefined) { params.push(dto.sortOrder); sets.push(`sort_order = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }
    if (dto.startsAt !== undefined) { params.push(dto.startsAt); sets.push(`starts_at = $${params.length}`); }
    if (dto.endsAt !== undefined) { params.push(dto.endsAt); sets.push(`ends_at = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    sets.push(`updated_at = now()`);
    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE banners SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('banner_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'banner.update',
      targetKind: 'banner',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteBanner(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `DELETE FROM banners WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('banner_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'banner.delete',
      targetKind: 'banner',
      targetId: id,
    });
  }

  // ─── Users ─────────────────────────────────────────────────────────────

  async listUsers(filter: {
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filter.q) {
      params.push(`%${filter.q}%`);
      const i = params.length;
      conditions.push(
        `(email ILIKE $${i} OR phone ILIKE $${i} OR display_name ILIKE $${i})`,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM users ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    params.push(limit);
    params.push(offset);

    const data = await this.dataSource.query(
      `SELECT id, email, display_name, phone, locale, status,
              email_verified_at, created_at, updated_at, deleted_at
         FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { data, total, page, limit };
  }

  async getUser(id: string): Promise<unknown> {
    const rows = await this.dataSource.query(
      `SELECT id, email, display_name, phone, locale, status,
              email_verified_at, created_at, updated_at, deleted_at
         FROM users WHERE id = $1`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException('user_not_found');
    }
    return rows[0];
  }

  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    adminId: string,
  ): Promise<unknown> {
    const before = await this.dataSource.query<Array<{ status: string }>>(
      `SELECT status FROM users WHERE id = $1`,
      [id],
    );
    if (!before.length) {
      throw new NotFoundException('user_not_found');
    }
    if (before[0].status === 'deleted') {
      throw new ConflictException('user_deleted');
    }

    const result = await this.dataSource.query<Array<Record<string, unknown>>>(
      `UPDATE users
          SET status = $1, updated_at = now()
        WHERE id = $2
        RETURNING id, email, display_name, phone, locale, status, created_at, updated_at`,
      [dto.status, id],
    );

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: dto.status === 'banned' ? 'user.ban' : 'user.reactivate',
      targetKind: 'user',
      targetId: id,
      before: { status: before[0].status },
      after: { status: dto.status },
      ...(dto.reason ? { reason: dto.reason } : {}),
    });

    return result[0];
  }

  async deleteUser(id: string, adminId: string): Promise<void> {
    const before = await this.dataSource.query<Array<{ status: string }>>(
      `SELECT status FROM users WHERE id = $1`,
      [id],
    );
    if (!before.length) {
      throw new NotFoundException('user_not_found');
    }

    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE users
          SET status = 'deleted',
              deleted_at = now(),
              email = 'deleted+' || id || '@senam.invalid',
              phone = NULL,
              display_name = NULL,
              password_hash = NULL,
              updated_at = now()
        WHERE id = $1 AND status != 'deleted'
        RETURNING id`,
      [id],
    );

    if (!result.length) {
      throw new ConflictException('user_already_deleted');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'user.delete',
      targetKind: 'user',
      targetId: id,
      before: { status: before[0].status },
      after: { status: 'deleted' },
    });
  }
}
