import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code (case-insensitive)' })
  @IsString()
  code!: string;

  @ApiProperty({ enum: ['percent', 'fixed'] })
  @IsEnum(['percent', 'fixed'])
  kind!: 'percent' | 'fixed';

  @ApiProperty({ description: 'Basis points for percent coupons or minor-currency units for fixed' })
  @IsNumber()
  valueBpsOrAmount!: number;

  @ApiProperty({ description: 'Minimum order amount in minor-currency units' })
  @IsNumber()
  minOrderAmount!: number;

  @ApiPropertyOptional({ description: 'Limit coupon to a specific category' })
  @IsOptional()
  @IsUUID()
  scopeCategoryId?: string;

  @ApiPropertyOptional({ description: 'Limit coupon to a specific company' })
  @IsOptional()
  @IsUUID()
  scopeCompanyId?: string;

  @ApiPropertyOptional({ description: 'Total usage cap' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCap?: number;

  @ApiPropertyOptional({ description: 'Per-user usage cap' })
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserCap?: number;

  @ApiProperty({ description: 'Valid from (ISO 8601)' })
  @IsDateString()
  validFrom!: string;

  @ApiProperty({ description: 'Valid until (ISO 8601)' })
  @IsDateString()
  validUntil!: string;
}
