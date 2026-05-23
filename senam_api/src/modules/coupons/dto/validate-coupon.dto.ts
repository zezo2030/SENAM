import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SUMMER20', description: 'Coupon code (case-insensitive)' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 5000, description: 'Order subtotal in minor-currency units (e.g. halalas)' })
  @IsNumber()
  @IsPositive()
  subtotal!: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'Company scope filter' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Category scope filter' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
