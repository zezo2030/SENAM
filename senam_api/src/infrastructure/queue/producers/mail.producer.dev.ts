import { Injectable, Logger } from '@nestjs/common';
import { MailPort } from '../../mail/mail.port.js';
import type { SendOtpJobData, SendTransactionalJobData } from './mail.producer.js';

@Injectable()
export class MailProducerDev {
  private readonly logger = new Logger(MailProducerDev.name);

  constructor(private readonly mail: MailPort) {}

  async enqueueOtp(data: SendOtpJobData): Promise<void> {
    this.logger.debug(`Sending OTP email directly (no Redis) to ${data.email}`);
    await this.mail.sendOtp({
      email: data.email,
      code: data.code,
      locale: data.locale,
    });
  }

  async enqueueTransactional(data: SendTransactionalJobData): Promise<void> {
    this.logger.debug(`Sending transactional email directly (no Redis) to ${data.email}`);
    await this.mail.sendTransactional({
      email: data.email,
      template: data.template,
      vars: data.vars,
      locale: data.locale,
    });
  }
}
