import { IsEmail, IsString, Length, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpVerifyDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ enum: ['customer', 'provider', 'admin'], default: 'customer' })
  @IsOptional()
  @IsIn(['customer', 'provider', 'admin'])
  principal?: 'customer' | 'provider' | 'admin' = 'customer';
}
