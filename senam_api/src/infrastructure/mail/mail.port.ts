export interface SendOtpOptions {
  email: string;
  code: string;
  locale: string;
}

export interface SendTransactionalOptions {
  email: string;
  template: string;
  vars: Record<string, unknown>;
  locale: string;
}

export abstract class MailPort {
  abstract sendOtp(options: SendOtpOptions): Promise<void>;
  abstract sendTransactional(options: SendTransactionalOptions): Promise<void>;
}
