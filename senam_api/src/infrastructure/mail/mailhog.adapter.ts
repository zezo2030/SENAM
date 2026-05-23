import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailPort, SendOtpOptions, SendTransactionalOptions } from './mail.port.js';

@Injectable()
export class MailhogMailAdapter extends MailPort {
  private readonly logger = new Logger(MailhogMailAdapter.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('MAIL_HOST', 'localhost'),
      port: config.get<number>('MAIL_PORT', 1025),
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendOtp(options: SendOtpOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get<string>('SES_FROM_ADDRESS', 'no-reply@senam.qa'),
      to: options.email,
      subject: 'Your SENAM verification code',
      text: `Your verification code is: ${options.code}\n\nThis code expires in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${options.code}</strong></p><p>This code expires in 10 minutes.</p>`,
    });
    this.logger.debug(`OTP sent to ${options.email}`);
  }

  async sendTransactional(options: SendTransactionalOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get<string>('SES_FROM_ADDRESS', 'no-reply@senam.qa'),
      to: options.email,
      subject: options.template,
      text: JSON.stringify(options.vars),
    });
    this.logger.debug(`Transactional email sent to ${options.email} template=${options.template}`);
  }
}
