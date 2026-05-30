import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  CompanyEntity,
  GalleryCategory,
} from './entities/company.entity.js';
import { CompanyGalleryPhotoEntity } from './entities/company-gallery-photo.entity.js';
import {
  UpsertGalleryCategoryDto,
  CreateGalleryPhotoDto,
  UpdateGalleryPhotoDto,
  ReorderGalleryPhotosDto,
} from './dto/gallery.dto.js';

/**
 * Owner-facing CRUD for the company's portfolio gallery + categories.
 * Categories live on the company row as JSONB to keep them free-form and
 * directly editable by the owner; photo rows reference a category by its
 * logical id (no FK).
 */
@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyGalleryPhotoEntity)
    private readonly photoRepo: Repository<CompanyGalleryPhotoEntity>,
  ) {}

  // ── Categories ────────────────────────────────────────────────────────

  async listCategories(companyId: string): Promise<GalleryCategory[]> {
    const company = await this.getCompanyOrThrow(companyId);
    return [...(company.galleryCategories ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  async createCategory(
    companyId: string,
    dto: UpsertGalleryCategoryDto,
  ): Promise<GalleryCategory> {
    const company = await this.getCompanyOrThrow(companyId);
    const current = company.galleryCategories ?? [];
    const sortOrder =
      dto.sortOrder ??
      (current.length ? Math.max(...current.map((c) => c.sortOrder)) + 1 : 0);
    const next: GalleryCategory = {
      id: randomUUID(),
      ar: dto.ar.trim(),
      en: dto.en.trim(),
      sortOrder,
    };
    company.galleryCategories = [...current, next];
    await this.companyRepo.save(company);
    return next;
  }

  async updateCategory(
    companyId: string,
    categoryId: string,
    dto: UpsertGalleryCategoryDto,
  ): Promise<GalleryCategory> {
    const company = await this.getCompanyOrThrow(companyId);
    const idx = (company.galleryCategories ?? []).findIndex(
      (c) => c.id === categoryId,
    );
    if (idx === -1) throw new NotFoundException('category_not_found');
    const cats = [...company.galleryCategories];
    cats[idx] = {
      ...cats[idx],
      ar: dto.ar.trim(),
      en: dto.en.trim(),
      sortOrder: dto.sortOrder ?? cats[idx].sortOrder,
    };
    company.galleryCategories = cats;
    await this.companyRepo.save(company);
    return cats[idx];
  }

  /**
   * Delete a category. Photos in the category are *not* deleted — they are
   * soft-rebucketed to "uncategorized" (`category_id = NULL`) so the owner
   * doesn't lose media when a category is removed.
   */
  async deleteCategory(companyId: string, categoryId: string): Promise<void> {
    const company = await this.getCompanyOrThrow(companyId);
    const before = company.galleryCategories ?? [];
    const after = before.filter((c) => c.id !== categoryId);
    if (after.length === before.length) {
      throw new NotFoundException('category_not_found');
    }
    company.galleryCategories = after;
    await this.companyRepo.save(company);
    await this.photoRepo.update(
      { companyId, categoryId },
      { categoryId: null },
    );
  }

  // ── Photos ────────────────────────────────────────────────────────────

  async listPhotos(
    companyId: string,
    categoryId?: string | null,
  ): Promise<CompanyGalleryPhotoEntity[]> {
    const where: Record<string, unknown> = { companyId };
    if (categoryId === null) where['categoryId'] = IsNull();
    else if (categoryId !== undefined) where['categoryId'] = categoryId;
    return this.photoRepo.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createPhoto(
    companyId: string,
    dto: CreateGalleryPhotoDto,
  ): Promise<CompanyGalleryPhotoEntity> {
    if (dto.categoryId) await this.assertCategoryExists(companyId, dto.categoryId);
    const sortOrder =
      dto.sortOrder ??
      (await this.photoRepo.count({
        where: {
          companyId,
          categoryId: dto.categoryId ? dto.categoryId : IsNull(),
        },
      }));
    const photo = this.photoRepo.create({
      companyId,
      categoryId: dto.categoryId ?? null,
      objectKey: dto.objectKey,
      captionAr: dto.captionAr ?? null,
      captionEn: dto.captionEn ?? null,
      sortOrder,
    });
    return this.photoRepo.save(photo);
  }

  async updatePhoto(
    companyId: string,
    photoId: string,
    dto: UpdateGalleryPhotoDto,
  ): Promise<CompanyGalleryPhotoEntity> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, companyId },
    });
    if (!photo) throw new NotFoundException('photo_not_found');
    if (dto.categoryId !== undefined) {
      if (dto.categoryId !== null) {
        await this.assertCategoryExists(companyId, dto.categoryId);
      }
      photo.categoryId = dto.categoryId;
    }
    if (dto.captionAr !== undefined) photo.captionAr = dto.captionAr;
    if (dto.captionEn !== undefined) photo.captionEn = dto.captionEn;
    if (dto.sortOrder !== undefined) photo.sortOrder = dto.sortOrder;
    return this.photoRepo.save(photo);
  }

  async deletePhoto(companyId: string, photoId: string): Promise<void> {
    const res = await this.photoRepo.delete({ id: photoId, companyId });
    if (!res.affected) throw new NotFoundException('photo_not_found');
  }

  async reorderPhotos(
    companyId: string,
    dto: ReorderGalleryPhotosDto,
  ): Promise<void> {
    if (!dto.items.length) return;
    const ids = dto.items.map((i) => i.id);
    const owned = await this.photoRepo.find({
      where: ids.map((id) => ({ id, companyId })),
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw new ConflictException('photo_not_in_company');
    }
    for (const item of dto.items) {
      await this.photoRepo.update(
        { id: item.id, companyId },
        { sortOrder: item.sortOrder },
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async getCompanyOrThrow(companyId: string): Promise<CompanyEntity> {
    const c = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!c) throw new NotFoundException('company_not_found');
    return c;
  }

  private async assertCategoryExists(
    companyId: string,
    categoryId: string,
  ): Promise<void> {
    const company = await this.getCompanyOrThrow(companyId);
    if (!(company.galleryCategories ?? []).some((c) => c.id === categoryId)) {
      throw new NotFoundException('category_not_found');
    }
  }
}
