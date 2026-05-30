import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ReviewEntity } from './entities/review.entity.js';
import { ReviewReplyEntity } from './entities/review-reply.entity.js';
import { RatingAggregatorService } from './rating-aggregator.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { CreateReviewReplyDto } from './dto/create-review-reply.dto.js';

/** Public-facing review row for the company reviews list (mobile app). */
export interface PublicReviewItem {
  id: string;
  authorName: string;
  authorPhotoUrl: string | null;
  stars: number;
  comment: string;
  createdAt: Date;
}

/**
 * Reviews are no longer order-gated. Any authenticated customer can leave
 * exactly one review per company; uniqueness is enforced by
 * `ux_reviews_company_customer`.
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ratingAggregator: RatingAggregatorService,
  ) {}

  async listForCompany(
    companyId: string,
    opts: { page?: number; limit?: number } = {},
  ): Promise<{
    items: PublicReviewItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
    const offset = (page - 1) * limit;

    // Join the reviewer so the public list can show their name (and photo
    // once user avatars exist). Falls back to a generic label when the
    // customer has no display name (e.g. phone-only signup).
    const rows = (await this.dataSource.query(
      `SELECT r.id,
              r.rating_company AS "stars",
              r.comment,
              r.created_at      AS "createdAt",
              COALESCE(NULLIF(btrim(u.display_name), ''), 'عميل') AS "authorName"
         FROM reviews r
         LEFT JOIN users u ON u.id = r.customer_id
        WHERE r.company_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3`,
      [companyId, limit, offset],
    )) as Array<{
      id: string;
      stars: number;
      comment: string | null;
      createdAt: Date;
      authorName: string;
    }>;

    const countRows = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS count FROM reviews WHERE company_id = $1`,
      [companyId],
    )) as Array<{ count: number }>;
    const total = countRows[0]?.count ?? 0;

    const items: PublicReviewItem[] = rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      authorPhotoUrl: null,
      stars: Number(r.stars ?? 0),
      comment: r.comment ?? '',
      createdAt: r.createdAt,
    }));

    return { items, total, page, limit };
  }

  async createReview(
    customerId: string,
    companyId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewEntity> {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const companies = (await qr.query(
        `SELECT id, status FROM companies WHERE id = $1`,
        [companyId],
      )) as Array<{ id: string; status: string }>;
      const company = companies[0];
      if (!company) throw new NotFoundException('company_not_found');
      if (company.status !== 'active') {
        throw new ForbiddenException('company_not_active');
      }

      const existing = await qr.manager.findOne(ReviewEntity, {
        where: { companyId, customerId },
      });
      if (existing) throw new ConflictException('review_already_exists');

      const review = qr.manager.create(ReviewEntity, {
        customerId,
        companyId,
        ratingCompany: dto.ratingCompany,
        ratingSpeed: dto.ratingSpeed ?? null,
        ratingQuality: dto.ratingQuality ?? null,
        comment: dto.comment ?? null,
        photoObjectKeys: dto.photoObjectKeys ?? [],
      });
      const saved = await qr.manager.save(ReviewEntity, review);

      await this.ratingAggregator.recomputeCompanyRating(companyId, qr);

      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateReview(
    customerId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewEntity> {
    const repo = this.dataSource.getRepository(ReviewEntity);
    const review = await repo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('review_not_found');
    if (review.customerId !== customerId) {
      throw new ForbiddenException('review_not_owned');
    }

    if (dto.ratingCompany !== undefined) review.ratingCompany = dto.ratingCompany;
    if (dto.ratingSpeed !== undefined) review.ratingSpeed = dto.ratingSpeed;
    if (dto.ratingQuality !== undefined) review.ratingQuality = dto.ratingQuality;
    if (dto.comment !== undefined) review.comment = dto.comment;
    if (dto.photoObjectKeys !== undefined) review.photoObjectKeys = dto.photoObjectKeys;

    const updated = await repo.save(review);
    await this.ratingAggregator.recomputeCompanyRating(review.companyId);
    return updated;
  }

  async deleteReview(customerId: string, reviewId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ReviewEntity);
    const review = await repo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('review_not_found');
    if (review.customerId !== customerId) {
      throw new ForbiddenException('review_not_owned');
    }
    await repo.delete({ id: reviewId });
    await this.ratingAggregator.recomputeCompanyRating(review.companyId);
  }

  async createReply(
    companyUserId: string,
    reviewId: string,
    dto: CreateReviewReplyDto,
  ): Promise<ReviewReplyEntity> {
    const review = await this.dataSource.getRepository(ReviewEntity).findOne({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('review_not_found');

    const existingReply = await this.dataSource
      .getRepository(ReviewReplyEntity)
      .findOne({ where: { reviewId } });
    if (existingReply) throw new ConflictException('reply_already_exists');

    const companyUsers = (await this.dataSource.query(
      `SELECT company_id FROM company_users WHERE id = $1`,
      [companyUserId],
    )) as Array<{ company_id: string }>;
    const companyUser = companyUsers[0];
    if (!companyUser || companyUser.company_id !== review.companyId) {
      throw new ForbiddenException('not_your_company_review');
    }

    const reply = this.dataSource.getRepository(ReviewReplyEntity).create({
      reviewId,
      companyUserId,
      body: dto.body,
    });
    return this.dataSource.getRepository(ReviewReplyEntity).save(reply);
  }
}
