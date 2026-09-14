import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class ApjReviewDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}
