import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyUserDto {
  @ApiProperty({ example: 'staff@example.com', description: 'Email address of the new staff member' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Ahmed Ali', description: 'Display name of the staff member' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ enum: ['staff'], default: 'staff', description: 'Role for the staff member' })
  @IsIn(['staff'])
  role: string = 'staff';
}
