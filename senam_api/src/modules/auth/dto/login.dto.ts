import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: ['customer', 'admin', 'provider'], default: 'customer' })
  @IsOptional()
  @IsIn(['customer', 'admin', 'provider'])
  principal?: 'customer' | 'admin' | 'provider' = 'customer';
}
