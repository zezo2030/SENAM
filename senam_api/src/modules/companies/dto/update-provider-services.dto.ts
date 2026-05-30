import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray } from 'class-validator';
import { IsUuidLoose } from '../../../common/decorators/is-uuid-loose.decorator.js';

export class UpdateProviderServicesDto {
  @ApiProperty({
    type: [String],
    description: 'Catalog service IDs selected by the provider company.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUuidLoose({ each: true })
  serviceIds!: string[];
}
