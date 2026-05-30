import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class LocalizedLabelDto {
  @ApiPropertyOptional({ example: 'ضمان على العمل' })
  @IsString()
  @Length(1, 60)
  ar!: string;

  @ApiPropertyOptional({ example: 'Workmanship warranty' })
  @IsString()
  @Length(1, 60)
  en!: string;

  @ApiPropertyOptional({ example: 'verified_user_outlined' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ description: 'Display name (Arabic)' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description (Arabic)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Primary phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Landline phone' })
  @IsOptional()
  @IsString()
  landline?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number with country code, digits only (e.g. 97455551234)',
  })
  @IsOptional()
  @IsString()
  whatsappLink?: string;

  @ApiPropertyOptional({ description: 'Instagram handle or URL' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o) => o.website !== null && o.website !== undefined)
  @IsUrl()
  website?: string | null;

  @ApiPropertyOptional({ description: 'Public email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Region / governorate' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Latitude (-90..90)' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (-180..180)' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Direct map URL (Google Maps, Apple Maps)' })
  @IsOptional()
  @IsString()
  mapUrl?: string;

  @ApiPropertyOptional({ type: [LocalizedLabelDto], description: 'مميزات الشركة chips' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalizedLabelDto)
  features?: LocalizedLabelDto[];
}
