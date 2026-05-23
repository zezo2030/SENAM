import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * MyFatoorah webhook receiver.
   * Must be @Public so the JWT guard doesn't block it.
   * Expects the raw request body for HMAC verification.
   */
  @Public()
  @Post('webhook/myfatoorah')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async myFatoorahWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-myf-signature') signature: string,
  ): Promise<{ received: true }> {
    // Use raw body if available (requires rawBody: true in NestJS app bootstrap)
    const body: unknown = req.rawBody
      ? req.rawBody.toString('utf8')
      : req.body;

    await this.paymentsService.handleWebhook(body, signature ?? '');
    return { received: true };
  }
}
