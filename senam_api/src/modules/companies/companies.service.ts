import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CompanyEntity, LocalizedLabel } from './entities/company.entity.js';
import { CompanyServiceEntity } from './entities/company-service.entity.js';
import { CompanyGalleryPhotoEntity } from './entities/company-gallery-photo.entity.js';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';
import { RegisterCompanyApplicationDto } from './dto/register-company-application.dto.js';
import { toStoredMediaPath } from '../../common/utils/media-url.util.js';

const PASSWORD_BCRYPT_ROUNDS = 12;

export interface CompanyApplicationResult {
  companyId: string;
  ownerUserId: string;
  status: 'pending';
  message: string;
}

export interface CompanyApplicationStatus {
  companyId: string;
  status: 'pending' | 'active' | 'suspended';
  approvedAt: Date | null;
  submittedAt: Date;
}

export interface CompanyApplicationDetail {
  id: string;
  companyId: string;
  status: 'pending' | 'active' | 'suspended';
  legalName: string;
  displayName: string;
  slug: string;
  description: string | null;
  logoObjectKey: string | null;
  coverObjectKey: string | null;
  features: LocalizedLabel[];
  categoryId: string | null;
  hasCommercialRegistration: boolean;
  commercialRegistrationNo: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  landline: string | null;
  whatsappLink: string | null;
  region: string | null;
  city: string | null;
  customServiceText: string | null;
  additionalNotes: string | null;
  subscriptionPlan: string | null;
  subscriptionPeriod: string | null;
  subscriptionPrice: number | null;
  submittedAt: Date;
  approvedAt: Date | null;
  services: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string | null;
    categoryId: string;
  }>;
  documents: Array<{ kind: string; objectKey: string }>;
  portfolioPhotos: Array<{ objectKey: string; sortOrder: number }>;
  owners: Array<{
    id: string;
    email: string;
    displayName: string | null;
    role: 'owner' | 'staff';
    status: 'active' | 'suspended';
  }>;
}

export interface CompanyDetail {
  id: string;
  displayName: string;
  legalName: string;
  slug: string;
  description: string | null;
  status: 'pending' | 'active' | 'suspended';
  categoryId: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  contacts: {
    whatsappLink: string | null;
    phone: string | null;
    landline: string | null;
    instagram: string | null;
    email: string | null;
    website: string | null;
  };
  location: {
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    mapUrl: string | null;
  };
  features: Array<{ ar: string; en: string; icon?: string }>;
  galleryCategories: Array<{ id: string; ar: string; en: string; sortOrder: number }>;
  gallery: Array<{
    categoryId: string | null;
    photos: Array<{
      id: string;
      url: string;
      captionAr: string | null;
      captionEn: string | null;
      sortOrder: number;
    }>;
  }>;
}

export interface ProviderServiceSelection {
  selectedServiceIds: string[];
  categories: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string | null;
    sortOrder: number;
    services: Array<{
      id: string;
      categoryId: string;
      slug: string;
      nameAr: string;
      nameEn: string | null;
      descriptionAr: string | null;
      descriptionEn: string | null;
      iconKey: string | null;
      imageKey: string | null;
      selected: boolean;
    }>;
  }>;
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyServiceEntity)
    private readonly companyServiceRepo: Repository<CompanyServiceEntity>,
    @InjectRepository(CompanyGalleryPhotoEntity)
    private readonly galleryPhotoRepo: Repository<CompanyGalleryPhotoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async submitApplication(
    dto: RegisterCompanyApplicationDto,
  ): Promise<CompanyApplicationResult> {
    const ownerEmail = dto.ownerEmail.trim().toLowerCase();
    const slug = dto.slug.trim().toLowerCase();

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const slugTaken = (await qr.query(
        `SELECT 1 FROM companies WHERE slug = $1 LIMIT 1`,
        [slug],
      )) as Array<unknown>;
      if (slugTaken.length) {
        throw new ConflictException('slug_already_in_use');
      }

      const emailTaken = (await qr.query(
        `SELECT 1 FROM company_users WHERE email = $1
         UNION ALL
         SELECT 1 FROM admin_users   WHERE email = $1
         UNION ALL
         SELECT 1 FROM users         WHERE email = $1 AND status != 'deleted'
         LIMIT 1`,
        [ownerEmail],
      )) as Array<unknown>;
      if (emailTaken.length) {
        throw new ConflictException('email_already_in_use');
      }

      const companyInsert = (await qr.query(
        `INSERT INTO companies (
            legal_name, display_name, slug, description, phone, status,
            logo_object_key, category_id, has_commercial_registration,
            commercial_registration_no, email, website, instagram,
            landline, whatsapp_link, region, city,
            custom_service_text, additional_notes,
            subscription_plan, subscription_period, subscription_price
         )
         VALUES (
            $1, $2, $3, $4, $5, 'pending',
            $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15, $16,
            $17, $18,
            $19, $20, $21
         )
         RETURNING id`,
        [
          dto.legalName,
          dto.displayName,
          slug,
          dto.description ?? null,
          dto.phone ?? null,
          dto.logoObjectKey ?? null,
          dto.categoryId ?? null,
          dto.hasCommercialRegistration ?? true,
          dto.commercialRegistrationNo ?? null,
          dto.email?.trim().toLowerCase() ?? null,
          dto.website ?? null,
          dto.instagram ?? null,
          dto.landline ?? null,
          dto.whatsappLink ?? null,
          dto.region ?? null,
          dto.city ?? null,
          dto.customServiceText ?? null,
          dto.additionalNotes ?? null,
          dto.subscriptionPlan ?? null,
          dto.subscriptionPeriod ?? null,
          dto.subscriptionPrice ?? null,
        ],
      )) as Array<{ id: string }>;
      const companyId = companyInsert[0].id;

      const passwordHash = await bcrypt.hash(dto.ownerPassword, PASSWORD_BCRYPT_ROUNDS);
      const ownerInsert = (await qr.query(
        `INSERT INTO company_users
           (company_id, email, display_name, role, status, password_hash)
         VALUES ($1, $2, $3, 'owner', 'active', $4)
         RETURNING id`,
        [companyId, ownerEmail, dto.ownerDisplayName ?? null, passwordHash],
      )) as Array<{ id: string }>;
      const ownerUserId = ownerInsert[0].id;

      for (const doc of dto.documents) {
        await qr.query(
          `INSERT INTO company_documents (company_id, kind, object_key)
           VALUES ($1, $2, $3)`,
          [companyId, doc.kind, doc.objectKey],
        );
      }

      if (dto.serviceIds?.length) {
        for (const serviceId of dto.serviceIds) {
          await qr.query(
            `INSERT INTO company_application_services (company_id, service_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [companyId, serviceId],
          );
        }
      }

      if (dto.portfolioPhotos?.length) {
        let i = 0;
        for (const photo of dto.portfolioPhotos) {
          await qr.query(
            `INSERT INTO company_portfolio_photos (company_id, object_key, sort_order)
             VALUES ($1, $2, $3)`,
            [companyId, photo.objectKey, photo.sortOrder ?? i],
          );
          i++;
        }
      }

      await qr.commitTransaction();

      return {
        companyId,
        ownerUserId,
        status: 'pending',
        message: 'application_submitted_pending_admin_review',
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async getApplicationStatus(companyId: string): Promise<CompanyApplicationStatus> {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
      select: { id: true, status: true, kycApprovedAt: true, createdAt: true },
    });
    if (!company) {
      throw new NotFoundException('application_not_found');
    }
    return {
      companyId: company.id,
      status: company.status,
      approvedAt: company.kycApprovedAt,
      submittedAt: company.createdAt,
    };
  }

  async getApplicationDetail(companyId: string): Promise<CompanyApplicationDetail> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('application_not_found');
    }

    // Read the *live* services the provider currently offers (edited from the
    // provider dashboard → company_services), not the registration snapshot
    // (company_application_services), so the admin sees the up-to-date set.
    const services = (await this.dataSource.query(
      `SELECT s.id, s.slug, s.name_ar AS "nameAr", s.name_en AS "nameEn",
              s.category_id AS "categoryId"
         FROM company_services cs
         JOIN services s ON s.id = cs.service_id
        WHERE cs.company_id = $1
          AND cs.is_active = true
        ORDER BY s.name_ar ASC`,
      [companyId],
    )) as CompanyApplicationDetail['services'];

    const documents = (await this.dataSource.query(
      `SELECT kind, object_key AS "objectKey"
         FROM company_documents
        WHERE company_id = $1`,
      [companyId],
    )) as CompanyApplicationDetail['documents'];

    // Live gallery photos managed from the provider dashboard, not the
    // registration-time portfolio snapshot (company_portfolio_photos).
    const portfolioPhotos = (await this.dataSource.query(
      `SELECT object_key AS "objectKey", sort_order AS "sortOrder"
         FROM company_gallery_photos
        WHERE company_id = $1
        ORDER BY sort_order ASC, created_at ASC`,
      [companyId],
    )) as CompanyApplicationDetail['portfolioPhotos'];

    const owners = (await this.dataSource.query(
      `SELECT id, email, display_name AS "displayName", role, status
         FROM company_users
        WHERE company_id = $1
        ORDER BY (role = 'owner') DESC, created_at ASC`,
      [companyId],
    )) as CompanyApplicationDetail['owners'];

    return {
      id: company.id,
      companyId: company.id,
      status: company.status,
      legalName: company.legalName,
      displayName: company.displayName,
      slug: company.slug,
      description: company.description,
      logoObjectKey: company.logoObjectKey,
      coverObjectKey: company.coverObjectKey,
      features: company.features ?? [],
      categoryId: company.categoryId,
      hasCommercialRegistration: company.hasCommercialRegistration,
      commercialRegistrationNo: company.commercialRegistrationNo,
      email: company.email,
      phone: company.phone,
      website: company.website,
      instagram: company.instagram,
      landline: company.landline,
      whatsappLink: company.whatsappLink,
      region: company.region,
      city: company.city,
      customServiceText: company.customServiceText,
      additionalNotes: company.additionalNotes,
      subscriptionPlan: company.subscriptionPlan,
      subscriptionPeriod: company.subscriptionPeriod,
      subscriptionPrice: company.subscriptionPrice,
      submittedAt: company.createdAt,
      approvedAt: company.kycApprovedAt,
      services,
      documents,
      portfolioPhotos,
      owners,
    };
  }

  async findAll(
    query: ListCompaniesQueryDto,
  ): Promise<Array<CompanyEntity & { subServiceIds: string[] }>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const qb = this.companyRepo
      .createQueryBuilder('c')
      .where("c.status = 'active'");

    if (query.serviceId) {
      qb.innerJoin(
        'company_services',
        'css',
        'css.company_id = c.id AND css.is_active = true AND css.service_id = :serviceId',
        { serviceId: query.serviceId },
      );
    }

    if (query.categoryId) {
      qb.innerJoin(
        'company_services',
        'cs',
        'cs.company_id = c.id AND cs.is_active = true AND cs.service_id IN ' +
          '(SELECT id FROM services WHERE category_id = :categoryId AND is_active = true)',
        { categoryId: query.categoryId },
      );
    }

    if (query.lat !== undefined && query.lng !== undefined) {
      // Use PostGIS ST_Distance to sort by proximity.
      // company_service_areas.area stores the geometry as text; we cast to geography.
      qb.leftJoin(
        'company_service_areas',
        'csa',
        'csa.company_id = c.id',
      )
        .addSelect(
          `ST_Distance(
            ST_Centroid(csa.area::geometry)::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
          )`,
          'distance',
        )
        .setParameters({ lat: query.lat, lng: query.lng })
        .orderBy('distance', 'ASC');
    } else if (query.sort === 'rating') {
      qb.orderBy('c.rating_avg', 'DESC');
    } else {
      qb.orderBy('c.display_name', 'ASC');
    }

    const companies = await qb.limit(limit).offset(offset).getMany();
    if (companies.length === 0) {
      return companies as Array<CompanyEntity & { subServiceIds: string[] }>;
    }

    // Attach the catalog service IDs each company actively offers, so the
    // mobile app can compute per-service company counts client-side.
    const ids = companies.map((c) => c.id);
    const serviceRows = (await this.dataSource.query(
      `SELECT company_id AS "companyId", service_id AS "serviceId"
         FROM company_services
        WHERE is_active = true
          AND company_id = ANY($1::uuid[])`,
      [ids],
    )) as Array<{ companyId: string; serviceId: string }>;

    const byCompany = new Map<string, string[]>();
    for (const row of serviceRows) {
      const list = byCompany.get(row.companyId) ?? [];
      list.push(row.serviceId);
      byCompany.set(row.companyId, list);
    }

    return companies.map((c) =>
      Object.assign(c, { subServiceIds: byCompany.get(c.id) ?? [] }),
    );
  }

  async findOne(id: string): Promise<CompanyDetail> {
    const company = await this.companyRepo.findOne({
      where: { id, status: 'active' },
    });
    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return this.toDetail(company);
  }

  /** Full company detail including gallery/categories/features for the mobile page. */
  async getCompanyDetail(id: string): Promise<CompanyDetail> {
    return this.findOne(id);
  }

  async findServices(companyId: string): Promise<CompanyServiceEntity[]> {
    return this.companyServiceRepo.find({
      where: { companyId, isActive: true },
      relations: { service: true },
      order: { service: { nameAr: 'ASC' } },
    });
  }

  async getProviderServiceSelection(
    companyId: string,
  ): Promise<ProviderServiceSelection> {
    await this.ensureCompanyExists(companyId);

    const rows = (await this.dataSource.query(
      `SELECT
          c.id         AS "categoryId",
          c.slug       AS "categorySlug",
          c.name_ar    AS "categoryNameAr",
          c.name_en    AS "categoryNameEn",
          c.sort_order AS "categorySortOrder",
          s.id         AS "serviceId",
          s.slug       AS "serviceSlug",
          s.name_ar    AS "serviceNameAr",
          s.name_en    AS "serviceNameEn",
          s.description_ar AS "serviceDescriptionAr",
          s.description_en AS "serviceDescriptionEn",
          s.icon_key   AS "serviceIconKey",
          s.image_key  AS "serviceImageKey",
          cs.id        AS "companyServiceId"
        FROM categories c
        LEFT JOIN services s
          ON s.category_id = c.id
         AND s.is_active = true
        LEFT JOIN company_services cs
          ON cs.service_id = s.id
         AND cs.company_id = $1
         AND cs.is_active = true
       WHERE c.is_active = true
       ORDER BY c.sort_order ASC, c.name_ar ASC, s.name_ar ASC`,
      [companyId],
    )) as Array<{
      categoryId: string;
      categorySlug: string;
      categoryNameAr: string;
      categoryNameEn: string | null;
      categorySortOrder: number;
      serviceId: string | null;
      serviceSlug: string | null;
      serviceNameAr: string | null;
      serviceNameEn: string | null;
      serviceDescriptionAr: string | null;
      serviceDescriptionEn: string | null;
      serviceIconKey: string | null;
      serviceImageKey: string | null;
      companyServiceId: string | null;
    }>;

    const categories = new Map<string, ProviderServiceSelection['categories'][number]>();
    const selectedServiceIds = new Set<string>();

    for (const row of rows) {
      let category = categories.get(row.categoryId);
      if (!category) {
        category = {
          id: row.categoryId,
          slug: row.categorySlug,
          nameAr: row.categoryNameAr,
          nameEn: row.categoryNameEn,
          sortOrder: row.categorySortOrder,
          services: [],
        };
        categories.set(row.categoryId, category);
      }

      if (!row.serviceId) continue;

      const selected = Boolean(row.companyServiceId);
      if (selected) selectedServiceIds.add(row.serviceId);

      category.services.push({
        id: row.serviceId,
        categoryId: row.categoryId,
        slug: row.serviceSlug ?? '',
        nameAr: row.serviceNameAr ?? '',
        nameEn: row.serviceNameEn,
        descriptionAr: row.serviceDescriptionAr,
        descriptionEn: row.serviceDescriptionEn,
        iconKey: row.serviceIconKey,
        imageKey: row.serviceImageKey,
        selected,
      });
    }

    return {
      selectedServiceIds: [...selectedServiceIds],
      categories: [...categories.values()],
    };
  }

  async updateProviderServices(
    companyId: string,
    serviceIds: string[],
  ): Promise<ProviderServiceSelection> {
    await this.ensureCompanyExists(companyId);

    const uniqueServiceIds = [...new Set(serviceIds.map((id) => id.trim()))];
    if (uniqueServiceIds.length) {
      const activeRows = (await this.dataSource.query(
        `SELECT id FROM services WHERE is_active = true AND id = ANY($1::uuid[])`,
        [uniqueServiceIds],
      )) as Array<{ id: string }>;
      if (activeRows.length !== uniqueServiceIds.length) {
        throw new BadRequestException('invalid_service_ids');
      }
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (uniqueServiceIds.length) {
        await qr.query(
          `DELETE FROM company_services
            WHERE company_id = $1
              AND NOT (service_id = ANY($2::uuid[]))`,
          [companyId, uniqueServiceIds],
        );

        for (const serviceId of uniqueServiceIds) {
          await qr.query(
            `INSERT INTO company_services (company_id, service_id, is_active)
             VALUES ($1, $2, true)
             ON CONFLICT (company_id, service_id)
             DO UPDATE SET is_active = true`,
            [companyId, serviceId],
          );
        }
      } else {
        await qr.query(`DELETE FROM company_services WHERE company_id = $1`, [
          companyId,
        ]);
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return this.getProviderServiceSelection(companyId);
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    return this.companyRepo.findOne({ where: { id } });
  }

  private async ensureCompanyExists(id: string): Promise<void> {
    const exists = await this.companyRepo.exists({ where: { id } });
    if (!exists) throw new NotFoundException(`Company ${id} not found`);
  }

  async getMyCompanyDetail(id: string): Promise<CompanyDetail> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return this.toDetail(company);
  }

  async updateProviderProfile(
    id: string,
    dto: UpdateProviderProfileDto,
  ): Promise<CompanyDetail> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);

    if (dto.displayName !== undefined) company.displayName = dto.displayName;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.phone !== undefined) company.phone = dto.phone;
    if (dto.landline !== undefined) company.landline = dto.landline;
    if (dto.whatsappLink !== undefined) company.whatsappLink = dto.whatsappLink;
    if (dto.instagram !== undefined) company.instagram = dto.instagram;
    if (dto.website !== undefined) company.website = dto.website;
    if (dto.email !== undefined) company.email = dto.email?.toLowerCase() ?? null;
    if (dto.city !== undefined) company.city = dto.city;
    if (dto.region !== undefined) company.region = dto.region;
    if (dto.latitude !== undefined) company.latitude = dto.latitude;
    if (dto.longitude !== undefined) company.longitude = dto.longitude;
    if (dto.mapUrl !== undefined) company.mapUrl = dto.mapUrl;
    if (dto.features !== undefined) company.features = dto.features;

    const saved = await this.companyRepo.save(company);
    return this.toDetail(saved);
  }

  async setLogo(id: string, objectKey: string): Promise<CompanyDetail> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    company.logoObjectKey = toStoredMediaPath(objectKey);
    const saved = await this.companyRepo.save(company);
    return this.toDetail(saved);
  }

  async setCover(id: string, objectKey: string): Promise<CompanyDetail> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    company.coverObjectKey = toStoredMediaPath(objectKey);
    const saved = await this.companyRepo.save(company);
    return this.toDetail(saved);
  }

  /** Build the public/provider-facing company detail payload. */
  private async toDetail(company: CompanyEntity): Promise<CompanyDetail> {
    const photos = await this.galleryPhotoRepo.find({
      where: { companyId: company.id },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const galleryByCat = new Map<string | null, CompanyDetail['gallery'][number]['photos']>();
    for (const p of photos) {
      const list = galleryByCat.get(p.categoryId) ?? [];
      list.push({
        id: p.id,
        url: p.objectKey ? toStoredMediaPath(p.objectKey) : '',
        captionAr: p.captionAr,
        captionEn: p.captionEn,
        sortOrder: p.sortOrder,
      });
      galleryByCat.set(p.categoryId, list);
    }

    const cats = [...(company.galleryCategories ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const gallery: CompanyDetail['gallery'] = cats.map((c) => ({
      categoryId: c.id,
      photos: galleryByCat.get(c.id) ?? [],
    }));
    const uncategorized = galleryByCat.get(null);
    if (uncategorized && uncategorized.length) {
      gallery.push({ categoryId: null, photos: uncategorized });
    }

    return {
      id: company.id,
      displayName: company.displayName,
      legalName: company.legalName,
      slug: company.slug,
      description: company.description,
      status: company.status,
      categoryId: company.categoryId,
      logoUrl: company.logoObjectKey ? toStoredMediaPath(company.logoObjectKey) : null,
      coverUrl: company.coverObjectKey ? toStoredMediaPath(company.coverObjectKey) : null,
      ratingAvg: Number(company.ratingAvg ?? 0),
      ratingCount: company.ratingCount ?? 0,
      contacts: {
        whatsappLink: company.whatsappLink,
        phone: company.phone,
        landline: company.landline,
        instagram: company.instagram,
        email: company.email,
        website: company.website,
      },
      location: {
        region: company.region,
        city: company.city,
        latitude: company.latitude,
        longitude: company.longitude,
        mapUrl: company.mapUrl,
      },
      features: company.features ?? [],
      galleryCategories: cats,
      gallery,
    };
  }
}
