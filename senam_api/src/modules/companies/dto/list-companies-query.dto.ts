import { IsOptional, IsNumber, Min, Max, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUuidLoose } from '../../../common/decorators/is-uuid-loose.decorator.js';
export class ListCompaniesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUuidLoose()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by catalog service ID' })
  @IsOptional()
  @IsUuidLoose()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Latitude for distance sorting' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for distance sorting' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ enum: ['nearest', 'rating'], description: 'Sort order' })
  @IsOptional()
  @IsIn(['nearest', 'rating'])
  sort?: 'nearest' | 'rating';

  @ApiPropertyOptional({ default: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Results per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
