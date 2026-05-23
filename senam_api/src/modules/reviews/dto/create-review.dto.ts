import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  ratingCompany!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingStaff?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingSpeed?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingQuality?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoObjectKeys?: string[];

  @IsOptional()
  @IsUUID()
  staffId?: string;
}
