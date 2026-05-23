import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const KYC_DOCUMENT_KINDS = [
  'commercial_registration',
  'tax_card',
  'owner_id',
  'premises_photo',
  'certification',
  'insurance',
] as const;
export type KycDocumentKind = (typeof KYC_DOCUMENT_KINDS)[number];

export const SUBSCRIPTION_PLANS = ['basic', 'pro', 'vip'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_PERIODS = ['monthly', 'annual', 'promo'] as const;
export type SubscriptionPeriod = (typeof SUBSCRIPTION_PERIODS)[number];

export class KycDocumentDto {
  @ApiProperty({ enum: KYC_DOCUMENT_KINDS })
  @IsIn(KYC_DOCUMENT_KINDS as unknown as string[])
  kind!: KycDocumentKind;

  @ApiProperty({
    example: 'kyc/30000000-0000-.../commercial_registration.pdf',
    description: 'Object-store key returned by the upload signed-URL flow',
  })
  @IsString()
  @MaxLength(512)
  objectKey!: string;
}

export class PortfolioPhotoDto {
  @ApiProperty({ example: 'portfolio/30000000-.../photo-1.jpg' })
  @IsString()
  @MaxLength(512)
  objectKey!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class RegisterCompanyApplicationDto {
  // ── Step 1: company info ───────────────────────────────────────────────
  @ApiProperty({ example: 'برق لغسيل السيارات' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName!: string;

  @ApiProperty({ example: 'برق' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({
    example: 'barq',
    description: 'URL slug — lowercase letters, numbers, dashes',
  })
  @IsString()
  @Matches(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/, {
    message: 'slug_invalid_format',
  })
  slug!: string;

  @ApiPropertyOptional({ description: 'Main service category (catalog category UUID).' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Object key for the uploaded logo.' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  logoObjectKey?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  hasCommercialRegistration?: boolean;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  commercialRegistrationNo?: string;

  @ApiPropertyOptional({ example: 'غسيل سيارات متنقل بأحدث المعدات' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '+97455123456' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: 'info@company.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://www.company.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: '@company' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  instagram?: string;

  @ApiPropertyOptional({ example: 'الدوحة' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @ApiPropertyOptional({ example: 'الوكرة' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  // ── Step 2: services ────────────────────────────────────────────────────
  @ApiPropertyOptional({
    type: [String],
    description: 'IDs of catalog services this company is applying to provide.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsUUID('all', { each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'Custom service the company wants to offer (Arabic).' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customServiceText?: string;

  // ── Step 3: portfolio + extra contact ───────────────────────────────────
  @ApiPropertyOptional({ type: [PortfolioPhotoDto], description: 'Up to 10 portfolio photos.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PortfolioPhotoDto)
  portfolioPhotos?: PortfolioPhotoDto[];

  @ApiPropertyOptional({ example: '40123456' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  landline?: string;

  @ApiPropertyOptional({ example: 'https://wa.me/97455123456' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  whatsappLink?: string;

  @ApiPropertyOptional({ description: 'Free-form additional notes (Arabic).' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalNotes?: string;

  // ── Step 4: subscription ────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: SUBSCRIPTION_PLANS })
  @IsOptional()
  @IsIn(SUBSCRIPTION_PLANS as unknown as string[])
  subscriptionPlan?: SubscriptionPlan;

  @ApiPropertyOptional({ enum: SUBSCRIPTION_PERIODS })
  @IsOptional()
  @IsIn(SUBSCRIPTION_PERIODS as unknown as string[])
  subscriptionPeriod?: SubscriptionPeriod;

  @ApiPropertyOptional({ example: 79900, description: 'Subscription price in halalas (smallest unit).' })
  @IsOptional()
  @IsInt()
  @Min(0)
  subscriptionPrice?: number;

  // ── Owner account (required for company dashboard login) ────────────────
  @ApiProperty({ example: 'owner@barq.qa', description: 'Email of the company owner account.' })
  @IsEmail()
  ownerEmail!: string;

  @ApiPropertyOptional({ example: 'مالك برق' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerDisplayName?: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  ownerPassword!: string;

  // ── KYC documents (still required) ──────────────────────────────────────
  @ApiProperty({
    type: [KycDocumentDto],
    description:
      'KYC documents already uploaded to object storage (commercial_registration and owner_id are required).',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => KycDocumentDto)
  documents!: KycDocumentDto[];
}
