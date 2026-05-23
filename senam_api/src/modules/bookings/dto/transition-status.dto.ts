import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALL_STATUSES = [
  'pending',
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'unassignable',
] as const;

export class TransitionStatusDto {
  @ApiProperty({
    enum: ALL_STATUSES,
    description: 'The target status to transition the order to',
    example: 'accepted',
  })
  @IsIn([...ALL_STATUSES])
  to!: string;
}
