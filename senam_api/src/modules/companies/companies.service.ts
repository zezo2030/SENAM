import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CompanyEntity } from './entities/company.entity.js';
import { CompanyServiceEntity } from './entities/company-service.entity.js';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';
import { RegisterCompanyApplicationDto } from './dto/register-company-application.dto.js';

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
  companyId: string;
  status: 'pending' | 'active' | 'suspended';
  legalName: string;
  displayName: string;
  slug: string;
  description: string | null;
  logoObjectKey: string | null;
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
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyServiceEntity)
    private readonly companyServiceRepo: Repository<CompanyServiceEntity>,
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

    const services = (await this.dataSource.query(
      `SELECT s.id, s.slug, s.name_ar AS "nameAr", s.name_en AS "nameEn",
              s.category_id AS "categoryId"
         FROM company_application_services cas
         JOIN services s ON s.id = cas.service_id
        WHERE cas.company_id = $1
        ORDER BY s.name_ar ASC`,
      [companyId],
    )) as CompanyApplicationDetail['services'];

    const documents = (await this.dataSource.query(
      `SELECT kind, object_key AS "objectKey"
         FROM company_documents
        WHERE company_id = $1`,
      [companyId],
    )) as CompanyApplicationDetail['documents'];

    const portfolioPhotos = (await this.dataSource.query(
      `SELECT object_key AS "objectKey", sort_order AS "sortOrder"
         FROM company_portfolio_photos
        WHERE company_id = $1
        ORDER BY sort_order ASC, created_at ASC`,
      [companyId],
    )) as CompanyApplicationDetail['portfolioPhotos'];

    return {
      companyId: company.id,
      status: company.status,
      legalName: company.legalName,
      displayName: company.displayName,
      slug: company.slug,
      description: company.description,
      logoObjectKey: company.logoObjectKey,
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
    };
  }

  async findAll(query: ListCompaniesQueryDto): Promise<CompanyEntity[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const qb = this.companyRepo
      .createQueryBuilder('c')
      .where("c.status = 'active'");

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

    return qb.limit(limit).offset(offset).getMany();
  }

  async findOne(id: string): Promise<CompanyEntity> {
    const company = await this.companyRepo.findOne({
      where: { id, status: 'active' },
    });
    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return company;
  }

  async findServices(companyId: string): Promise<CompanyServiceEntity[]> {
    return this.companyServiceRepo.find({
      where: { companyId, isActive: true },
      relations: { service: true },
      order: { service: { nameAr: 'ASC' } },
    });
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    return this.companyRepo.findOne({ where: { id } });
  }

  async updateProviderProfile(
    id: string,
    dto: UpdateProviderProfileDto,
  ): Promise<CompanyEntity> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }

    if (dto.displayName !== undefined) {
      company.displayName = dto.displayName;
    }
    if (dto.description !== undefined) {
      company.description = dto.description;
    }
    if (dto.phone !== undefined) {
      company.phone = dto.phone;
    }

    return this.companyRepo.save(company);
  }
}
