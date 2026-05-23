import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveCompanyDto {
  @ApiPropertyOptional({ description: 'Optional notes for approval' })
  @IsOptional()
  @IsString()
  notes?: string;
}
