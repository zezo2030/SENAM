import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkPaidDto {
  @ApiProperty({ description: 'Bank transfer reference number', example: 'TXN-2026-001234' })
  @IsString()
  @MinLength(3)
  payoutReference!: string;
}
