import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuspendCompanyDto {
  @ApiProperty({ description: 'Reason for suspension' })
  @IsString()
  reason!: string;
}
