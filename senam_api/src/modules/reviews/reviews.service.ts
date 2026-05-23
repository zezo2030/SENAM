import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ReviewEntity } from './entities/review.entity.js';
import { ReviewReplyEntity } from './entities/review-reply.entity.js';
import { RatingAggregatorService } from './rating-aggregator.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { CreateReviewReplyDto } from './dto/create-review-reply.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ratingAggregator: RatingAggregatorService,
  ) {}

  async createReview(
    customerId: string,
    orderId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewEntity> {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const orders = await qr.query(
        `SELECT id, customer_id, company_id, assigned_staff_id, status FROM orders WHERE id = $1`,
        [orderId],
      ) as Array<{
        id: string;
        customer_id: string;
        company_id: string;
        assigned_staff_id: string | null;
        status: string;
      }>;

      const order = orders[0];
      if (!order) {
        throw new NotFoundException('order_not_found');
      }
      if (order.customer_id !== customerId) {
        throw new ForbiddenException('order_not_owned');
      }
      if (order.status !== 'completed') {
        throw new UnprocessableEntityException('order_not_completed');
      }

      const existing = await qr.manager.findOne(ReviewEntity, {
        where: { orderId },
      });
      if (existing) {
        throw new ConflictException('review_already_exists');
      }

      const review = qr.manager.create(ReviewEntity, {
        orderId,
        customerId,
        companyId: order.company_id,
        staffId: dto.staffId ?? null,
        ratingCompany: dto.ratingCompany,
        ratingStaff: dto.ratingStaff ?? null,
        ratingSpeed: dto.ratingSpeed ?? null,
        ratingQuality: dto.ratingQuality ?? null,
        comment: dto.comment ?? null,
        photoObjectKeys: dto.photoObjectKeys ?? [],
        lockedAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      const saved = await qr.manager.save(ReviewEntity, review);

      await this.ratingAggregator.recomputeCompanyRating(order.company_id, qr);

      if (saved.staffId) {
        await this.ratingAggregator.recomputeStaffRating(saved.staffId, qr);
      }

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
    if (!review) {
      throw new NotFoundException('review_not_found');
    }
    if (review.customerId !== customerId) {
      throw new ForbiddenException('review_not_owned');
    }
    if (review.lockedAt <= new Date()) {
      throw new UnprocessableEntityException('review_locked');
    }

    if (dto.ratingCompany !== undefined) review.ratingCompany = dto.ratingCompany;
    if (dto.ratingStaff !== undefined) review.ratingStaff = dto.ratingStaff;
    if (dto.ratingSpeed !== undefined) review.ratingSpeed = dto.ratingSpeed;
    if (dto.ratingQuality !== undefined) review.ratingQuality = dto.ratingQuality;
    if (dto.comment !== undefined) review.comment = dto.comment;
    if (dto.photoObjectKeys !== undefined) review.photoObjectKeys = dto.photoObjectKeys;

    const updated = await repo.save(review);

    await this.ratingAggregator.recomputeCompanyRating(review.companyId);
    if (review.staffId) {
      await this.ratingAggregator.recomputeStaffRating(review.staffId);
    }

    return updated;
  }

  async createReply(
    companyUserId: string,
    reviewId: string,
    dto: CreateReviewReplyDto,
  ): Promise<ReviewReplyEntity> {
    const review = await this.dataSource.getRepository(ReviewEntity).findOne({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('review_not_found');
    }

    const existingReply = await this.dataSource
      .getRepository(ReviewReplyEntity)
      .findOne({ where: { reviewId } });
    if (existingReply) {
      throw new ConflictException('reply_already_exists');
    }

    const companyUsers = await this.dataSource.query(
      `SELECT company_id FROM company_users WHERE id = $1`,
      [companyUserId],
    ) as Array<{ company_id: string }>;

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
