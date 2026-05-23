import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommissionDto {
  @ApiProperty({ description: 'Commission in basis points (1000-2500)', minimum: 1000, maximum: 2500 })
  @IsInt()
  @Min(1000)
  @Max(2500)
  commissionBps!: number;
}
