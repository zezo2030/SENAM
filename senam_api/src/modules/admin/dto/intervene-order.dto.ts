import { IsString, IsEnum, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type InterventionAction = 'cancel' | 'refund_full' | 'refund_partial' | 'reassign';

export class InterveneOrderDto {
  @ApiProperty({ enum: ['cancel', 'refund_full', 'refund_partial', 'reassign'] })
  @IsEnum(['cancel', 'refund_full', 'refund_partial', 'reassign'])
  action!: InterventionAction;

  @ApiPropertyOptional({ description: 'Amount in minor-currency units (required for refund_partial)' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: 'Reason for intervention' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'New company ID for reassign action' })
  @IsOptional()
  @IsUUID()
  newCompanyId?: string;
}
