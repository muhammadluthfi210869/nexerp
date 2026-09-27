import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
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

  /**
   * BUS-RULE-110. Intentionally optional at the DTO layer: the service is what
   * rejects a decision without a version, and it does so with the contractual
   * reason code DESIGN_VERSION_REQUIRED.
   */
  @IsOptional()
  @IsUUID()
  versionId?: string;
}
