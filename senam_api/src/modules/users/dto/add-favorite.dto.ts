import {} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUuidLoose } from '../../../common/decorators/is-uuid-loose.decorator.js';
export class AddFavoriteDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUuidLoose()
  companyId!: string;
}
