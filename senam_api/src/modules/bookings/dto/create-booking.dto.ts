import {
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookingServiceItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  companyServiceId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export type PaymentMethodEnum = 'card' | 'applepay' | 'googlepay' | 'cod';

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ type: [BookingServiceItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingServiceItemDto)
  services!: BookingServiceItemDto[];

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  slotId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  addressId!: string;

  @ApiProperty({ enum: ['card', 'applepay', 'googlepay', 'cod'] })
  @IsEnum(['card', 'applepay', 'googlepay', 'cod'])
  paymentMethod!: PaymentMethodEnum;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  couponId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Required for online payment methods' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
