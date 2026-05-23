import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { TransitionStatusDto } from './dto/transition-status.dto.js';
import { StatusService } from './status.service.js';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly statusService: StatusService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  createBooking(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: "List the customer's bookings" })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  listBookings(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.listBookings(user.sub, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getBooking(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.getBooking(user.sub, id);
  }

  @Post(':id/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a draft DTO based on an existing booking (no DB writes)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  reorder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.reorder(user.sub, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  cancelBooking(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.cancelBooking(user.sub, id);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition an order status' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  statusTransition(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionStatusDto,
  ) {
    return this.statusService.transition(id, dto.to, user);
  }
}
