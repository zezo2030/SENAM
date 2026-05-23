import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
} from '@aws-sdk/client-ses';
import { MailPort, SendOtpOptions, SendTransactionalOptions } from './mail.port.js';

@Injectable()
export class SesMailAdapter extends MailPort {
  private readonly logger = new Logger(SesMailAdapter.name);
  private readonly client: SESClient;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.fromAddress = config.get<string>('SES_FROM_ADDRESS', 'no-reply@senam.qa');
    const accessKeyId = config.get<string>('AWS_SES_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SES_SECRET_ACCESS_KEY');
    this.client = new SESClient({
      region: config.get<string>('AWS_SES_REGION', 'me-south-1'),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async sendOtp(options: SendOtpOptions): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: this.fromAddress,
        Destination: { ToAddresses: [options.email] },
        Message: {
          Subject: { Data: 'Your SENAM verification code', Charset: 'UTF-8' },
          Body: {
            Text: {
              Data: `Your verification code is: ${options.code}\n\nThis code expires in 10 minutes.`,
              Charset: 'UTF-8',
            },
          },
        },
      }),
    );
    this.logger.log(`OTP sent via SES to ${options.email}`);
  }

  async sendTransactional(options: SendTransactionalOptions): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: this.fromAddress,
        Destination: { ToAddresses: [options.email] },
        Message: {
          Subject: { Data: options.template, Charset: 'UTF-8' },
          Body: {
            Text: { Data: JSON.stringify(options.vars), Charset: 'UTF-8' },
          },
        },
      }),
    );
    this.logger.log(`Transactional email sent via SES to ${options.email}`);
  }
}
