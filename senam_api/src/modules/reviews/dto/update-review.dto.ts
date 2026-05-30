import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingCompany?: number;

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
  @Length(0, 2000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoObjectKeys?: string[];
}
