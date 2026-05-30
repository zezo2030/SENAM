import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsUuidLoose } from '../../../common/decorators/is-uuid-loose.decorator.js';
export class CreateServiceDto {
  @ApiProperty({ description: 'Category UUID' })
  @IsUuidLoose()
  categoryId!: string;

  @ApiProperty({ description: 'URL-safe slug' })
  @IsString()
  slug!: string;

  @ApiProperty({ description: 'Arabic name' })
  @IsString()
  nameAr!: string;

  @ApiPropertyOptional({ description: 'English name' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Arabic description' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'English description' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Uploaded icon object key' })
  @IsOptional()
  @IsString()
  iconKey?: string;

  @ApiPropertyOptional({ description: 'Uploaded banner image object key' })
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ApiPropertyOptional({ description: 'Whether service is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
