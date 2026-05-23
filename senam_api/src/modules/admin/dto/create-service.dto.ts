import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Category UUID' })
  @IsUUID()
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

  @ApiPropertyOptional({ description: 'Base duration in minutes', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  baseDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Whether service is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
