import { IsString, IsNumber, IsBoolean, IsOptional, Min, validateSync } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  NODE_ENV: string = 'development';

  @Type(() => Number)
  @IsNumber()
  PORT: number = 3000;

  @IsString()
  APP_BASE_URL: string = 'http://localhost:3000';

  @IsString()
  LOG_LEVEL: string = 'info';

  @IsString()
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  REDIS_ENABLED?: string | boolean;

  @IsString()
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(60)
  JWT_ACCESS_TTL_SECONDS: number = 900;

  @Type(() => Number)
  @IsNumber()
  @Min(3600)
  JWT_REFRESH_TTL_SECONDS: number = 2592000;

  @Type(() => Number)
  @IsNumber()
  OTP_RATE_LIMIT_ISSUE_PER_HOUR: number = 3;

  @Type(() => Number)
  @IsNumber()
  OTP_RATE_LIMIT_VERIFY_ATTEMPTS: number = 5;

  @Type(() => Number)
  @IsNumber()
  DISPATCH_ATTEMPT_TIMEOUT_MS: number = 300000;

  @Type(() => Number)
  @IsNumber()
  DISPATCH_MAX_ATTEMPTS: number = 3;

  @IsString()
  SETTLEMENT_CRON: string = '0 30 0 * * 0';

  @Type(() => Number)
  @IsNumber()
  CARRY_FORWARD_ALERT_THRESHOLD: number = 10000;

  @IsString()
  MYFATOORAH_API_KEY!: string;

  @Type(() => Boolean)
  @IsBoolean()
  MYFATOORAH_SANDBOX: boolean = true;

  @IsString()
  MYFATOORAH_WEBHOOK_SECRET!: string;

  @IsString()
  AWS_SES_REGION: string = 'me-south-1';

  @IsOptional()
  @IsString()
  AWS_SES_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SES_SECRET_ACCESS_KEY?: string;

  @IsString()
  SES_FROM_ADDRESS: string = 'no-reply@senam.qa';

  @IsString()
  MAIL_HOST: string = 'localhost';

  @Type(() => Number)
  @IsNumber()
  MAIL_PORT: number = 1025;

  @IsString()
  S3_ENDPOINT!: string;

  @IsString()
  S3_REGION: string = 'auto';

  @IsString()
  S3_BUCKET!: string;

  @IsString()
  S3_ACCESS_KEY_ID!: string;

  @IsString()
  S3_SECRET_ACCESS_KEY!: string;

  @IsOptional()
  @IsString()
  S3_PUBLIC_BASE_URL?: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
