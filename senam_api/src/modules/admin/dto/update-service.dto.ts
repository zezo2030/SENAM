import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsUuidLoose } from '../../../common/decorators/is-uuid-loose.decorator.js';
export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLoose()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
