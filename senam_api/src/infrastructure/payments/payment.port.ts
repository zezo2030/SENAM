export interface AuthorisePaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  paymentMethod: string;
}

export interface AuthorisePaymentResult {
  providerPaymentId: string;
  redirectUrl?: string | undefined;
  status: 'authorised' | 'pending_redirect';
}

export interface RefundPaymentOptions {
  providerPaymentId: string;
  amount: number;
  reason: string;
}

export interface RefundPaymentResult {
  providerRefundId: string;
}

export interface WebhookVerificationOptions {
  payload: string;
  signature: string;
}

export abstract class PaymentPort {
  abstract authorise(options: AuthorisePaymentOptions): Promise<AuthorisePaymentResult>;
  abstract capture(providerPaymentId: string): Promise<void>;
  abstract refund(options: RefundPaymentOptions): Promise<RefundPaymentResult>;
  abstract verifyWebhook(options: WebhookVerificationOptions): boolean;
}
