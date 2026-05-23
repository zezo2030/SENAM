import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PaymentPort,
  AuthorisePaymentOptions,
  AuthorisePaymentResult,
  RefundPaymentOptions,
  RefundPaymentResult,
  WebhookVerificationOptions,
} from './payment.port.js';

@Injectable()
export class MyFatoorahPaymentAdapter extends PaymentPort {
  private readonly logger = new Logger(MyFatoorahPaymentAdapter.name);
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.apiKey = config.get<string>('MYFATOORAH_API_KEY')!;
    this.webhookSecret = config.get<string>('MYFATOORAH_WEBHOOK_SECRET')!;
    const isSandbox = config.get<boolean>('MYFATOORAH_SANDBOX', true);
    this.baseUrl = isSandbox
      ? 'https://apitest.myfatoorah.com'
      : 'https://api.myfatoorah.com';
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new UnprocessableEntityException(`MyFatoorah error: ${text}`);
    }
    return response.json() as Promise<T>;
  }

  async authorise(options: AuthorisePaymentOptions): Promise<AuthorisePaymentResult> {
    const body = {
      InvoiceValue: options.amount / 100,
      CustomerEmail: `order-${options.orderId}@senam.internal`,
      CallBackUrl: options.returnUrl,
      ErrorUrl: options.returnUrl,
      Language: 'en',
      CustomerReference: options.orderId,
      DisplayCurrencyIso: options.currency,
    };

    const result = await this.post<{
      IsSuccess: boolean;
      Data: { InvoiceId: string; IsDirectPayment: boolean; PaymentURL?: string };
    }>('/v2/SendPayment', body);

    this.logger.log(`Payment initiated for order ${options.orderId}, invoiceId=${result.Data.InvoiceId}`);

    return {
      providerPaymentId: String(result.Data.InvoiceId),
      redirectUrl: result.Data.PaymentURL,
      status: result.Data.PaymentURL ? 'pending_redirect' : 'authorised',
    };
  }

  async capture(_providerPaymentId: string): Promise<void> {
    // MyFatoorah captures automatically on payment completion — no separate capture call needed for MVP
  }

  async refund(options: RefundPaymentOptions): Promise<RefundPaymentResult> {
    const result = await this.post<{
      IsSuccess: boolean;
      Data: { RefundId: string };
    }>('/v2/MakeRefund', {
      KeyType: 'InvoiceId',
      Key: options.providerPaymentId,
      RefundChargeOnCustomer: false,
      ServiceChargeOnCustomer: false,
      Amount: options.amount / 100,
      Comment: options.reason,
    });

    return { providerRefundId: String(result.Data.RefundId) };
  }

  verifyWebhook(options: WebhookVerificationOptions): boolean {
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(options.payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(options.signature));
  }
}
