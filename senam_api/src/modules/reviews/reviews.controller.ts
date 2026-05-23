import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { CreateReviewReplyDto } from './dto/create-review-reply.dto.js';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('bookings/:id/review')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review for a completed booking' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  createReview(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.sub, id, dto);
  }

  @Patch('reviews/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a review (within 48-hour window)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  updateReview(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user.sub, id, dto);
  }

  @Post('reviews/:id/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a company reply to a review' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  createReply(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewReplyDto,
  ) {
    return this.reviewsService.createReply(user.sub, id, dto);
  }
}
