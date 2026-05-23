import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from './entities/review.entity.js';
import { ReviewReplyEntity } from './entities/review-reply.entity.js';
import { ReviewsService } from './reviews.service.js';
import { RatingAggregatorService } from './rating-aggregator.service.js';
import { ReviewsController } from './reviews.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity, ReviewReplyEntity])],
  controllers: [ReviewsController],
  providers: [ReviewsService, RatingAggregatorService],
  exports: [ReviewsService, RatingAggregatorService],
})
export class ReviewsModule {}
