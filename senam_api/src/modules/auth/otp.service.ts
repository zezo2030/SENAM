import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CacheService } from '../../infrastructure/cache/cache.service.js';
import { MailProducer } from '../../infrastructure/queue/producers/mail.producer.js';

@Injectable()
export class OtpService {
  private readonly issueRateLimit: number;
  private readonly verifyRateLimit: number;

  constructor(
    private readonly cache: CacheService,
    private readonly mailProducer: MailProducer,
    private readonly config: ConfigService,
  ) {
    this.issueRateLimit = config.get<number>('OTP_RATE_LIMIT_ISSUE_PER_HOUR', 3);
    this.verifyRateLimit = config.get<number>('OTP_RATE_LIMIT_VERIFY_ATTEMPTS', 5);
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private issueLimitKey(email: string): string {
    return `otp:issue_limit:${email}`;
  }

  private verifyAttemptsKey(email: string): string {
    return `otp:verify_attempts:${email}`;
  }

  private otpHashKey(email: string): string {
    return `otp:hash:${email}`;
  }

  async sendOtp(email: string, locale = 'ar'): Promise<void> {
    const count = await this.cache.incrWithExpire(this.issueLimitKey(email), 3600);
    if (count > this.issueRateLimit) {
      throw new HttpException('otp_rate_limited', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.generateCode();
    const hash = await bcrypt.hash(code, 10);

    await this.cache.set(this.otpHashKey(email), hash, 600);
    await this.cache.del(this.verifyAttemptsKey(email));

    await this.mailProducer.enqueueOtp({ email, code, locale });
  }

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const attempts = await this.cache.incrWithExpire(this.verifyAttemptsKey(email), 600);
    if (attempts > this.verifyRateLimit) {
      throw new HttpException('otp_max_attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    const hash = await this.cache.get(this.otpHashKey(email));
    if (!hash) {
      throw new UnauthorizedException('otp_invalid');
    }

    const valid = await bcrypt.compare(code, hash);
    if (!valid) {
      throw new UnauthorizedException('otp_invalid');
    }

    await this.cache.del(this.otpHashKey(email));
    await this.cache.del(this.verifyAttemptsKey(email));
    return true;
  }
}
