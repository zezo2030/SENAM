import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['customer', 'provider', 'admin'], default: 'customer' })
  @IsOptional()
  @IsIn(['customer', 'provider', 'admin'])
  principal?: 'customer' | 'provider' | 'admin' = 'customer';
}
