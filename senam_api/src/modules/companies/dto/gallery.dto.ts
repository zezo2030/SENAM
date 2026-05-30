import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetMediaObjectKeyDto {
  @ApiProperty({ example: 'company_cover/abc-123.jpg' })
  @IsString()
  objectKey!: string;
}

export class UpsertGalleryCategoryDto {
  @ApiProperty({ example: 'مطابخ حديثة' })
  @IsString()
  @Length(1, 60)
  ar!: string;

  @ApiProperty({ example: 'Modern kitchens' })
  @IsString()
  @Length(1, 60)
  en!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateGalleryPhotoDto {
  @ApiProperty({ example: 'gallery_photo/xyz.jpg' })
  @IsString()
  objectKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  captionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  captionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateGalleryPhotoDto {
  @ApiPropertyOptional({ description: 'Pass null to move to "uncategorized"' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  captionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  captionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class ReorderEntry {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderGalleryPhotosDto {
  @ApiProperty({ type: [ReorderEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderEntry)
  items!: ReorderEntry[];
}
