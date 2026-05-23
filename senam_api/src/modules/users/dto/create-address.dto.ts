import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: 'Building 12, Street 34' })
  @IsNotEmpty()
  @IsString()
  line!: string;

  @ApiPropertyOptional({ example: 'Al Sadd' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: 'Doha' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 25.2854 })
  @IsNumber()
  @Min(24.0)
  @Max(26.5)
  @Type(() => Number)
  lat!: number;

  @ApiProperty({ example: 51.531 })
  @IsNumber()
  @Min(50.5)
  @Max(51.8)
  @Type(() => Number)
  lng!: number;

  @ApiPropertyOptional({ example: 'Ring the bell twice' })
  @IsOptional()
  @IsString()
  accessNotes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
