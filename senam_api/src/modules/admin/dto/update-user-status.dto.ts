import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserStatusDto {
  @IsIn(['active', 'banned'])
  status!: 'active' | 'banned';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
