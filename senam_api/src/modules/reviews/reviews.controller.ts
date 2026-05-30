import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
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

  @Public()
  @Get('companies/:id/reviews')
  @ApiOperation({ summary: 'List reviews for a company (public)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  listForCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const opts: { page?: number; limit?: number } = {};
    if (page) opts.page = Number(page);
    if (limit) opts.limit = Number(limit);
    return this.reviewsService.listForCompany(id, opts);
  }

  @Post('companies/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a review for a company (one per customer)' })
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
  @ApiOperation({ summary: 'Update your review' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  updateReview(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user.sub, id, dto);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your review' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async deleteReview(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.reviewsService.deleteReview(user.sub, id);
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
