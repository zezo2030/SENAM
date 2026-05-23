import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReviewReplyDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
