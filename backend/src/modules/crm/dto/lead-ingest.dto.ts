// Inbound webhook payload from dreamlab.id lead-svc-deploy.
// POST /crm/leads/ingest with X-Dreamlab-Signature header.
// All fields optional except `leadCaptureId` and `phone` (minimum viable).

import { IsOptional, IsString, IsUUID, MaxLength, IsEnum } from "class-validator";
import { LeadSource } from "@prisma/client";

export class LeadIngestDto {
  @IsUUID()
  leadCaptureId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  trackingCode?: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsEnum(LeadSource, {
    message: `source must be one of: ${Object.values(LeadSource).join(", ")}`,
  })
  source!: LeadSource;

  @IsOptional()
  @IsString()
  pageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageTitle?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  intent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  browser?: string;
}
