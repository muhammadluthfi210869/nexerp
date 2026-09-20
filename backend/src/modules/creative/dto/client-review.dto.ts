import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class ClientReviewDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * BUS-RULE-110. Optional at the DTO layer on purpose — see ApjReviewDto.
   */
  @IsOptional()
  @IsUUID()
  versionId?: string;

  /** BUS-RULE-111: required by the service when the decision is a revision request. */
  @IsOptional()
  @IsString()
  reason?: string;
}
