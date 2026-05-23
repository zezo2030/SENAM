import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'Building 12, Street 34' })
  @IsOptional()
  @IsString()
  line?: string;

  @ApiPropertyOptional({ example: 'Al Sadd' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: 'Doha' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 25.2854 })
  @IsOptional()
  @IsNumber()
  @Min(24.0)
  @Max(26.5)
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ example: 51.531 })
  @IsOptional()
  @IsNumber()
  @Min(50.5)
  @Max(51.8)
  @Type(() => Number)
  lng?: number;

  @ApiPropertyOptional({ example: 'Ring the bell twice' })
  @IsOptional()
  @IsString()
  accessNotes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
