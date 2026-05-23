import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
  IsISO8601,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ description: 'Arabic title' })
  @IsString()
  titleAr!: string;

  @ApiPropertyOptional({ description: 'English title' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Arabic subtitle' })
  @IsOptional()
  @IsString()
  subtitleAr?: string;

  @ApiPropertyOptional({ description: 'English subtitle' })
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiProperty({ description: 'Image URL (CDN/S3)' })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional({ description: 'Tap-through link URL' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({
    description: 'Target type (category | service | company | external | none)',
  })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({ description: 'Target id matching targetType' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Display sort order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether banner is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Visible from (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Visible until (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  endsAt?: string;
}
