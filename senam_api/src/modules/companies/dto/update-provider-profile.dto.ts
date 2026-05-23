import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ example: 'My Company', description: 'Company display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'We provide excellent services', description: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '+966501234567', description: 'Company phone number' })
  @IsOptional()
  @IsString()
  phone?: string;
}
