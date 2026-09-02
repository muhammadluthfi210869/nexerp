import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { WorkflowStatus, LostReason, PaymentType } from '@prisma/client';

export class AdvanceLeadDto {
  @IsEnum(['STAGE_UPDATED', 'FOLLOW_UP'])
  action!: 'STAGE_UPDATED' | 'FOLLOW_UP';

  @IsEnum(WorkflowStatus)
  newStatus!: WorkflowStatus;

  @IsOptional()
  @IsEnum(LostReason)
  lostReason?: LostReason;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRepeatOrder?: boolean;

  @IsOptional()
  @IsString()
  pnfFileUrl?: string;

  @IsOptional()
  @IsString()
  spkFileUrl?: string;

  @IsOptional()
  @IsString()
  clientExpectations?: string;

  // --- FINANCE INTEGRATION FIELDS ---
  @IsOptional()
  @IsString()
  paymentProofUrl?: string;

  @IsOptional()
  @IsNumber()
  downPaymentAmount?: number;

  // --- NPF / R&D HANDOVER FIELDS ---
  @IsOptional()
  @IsString()
  productConcept?: string;

  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @IsString()
  loggedBy!: string;

  // --- LEAD DETAIL FIELDS ---
  @IsOptional()
  @IsString()
  productCategory?: string;

  @IsOptional()
  @IsNumber()
  estimatedMoq?: number;

  @IsOptional()
  @IsNumber()
  planOmset?: number;

  @IsOptional()
  @IsString()
  packagingSuggestion?: string;

  @IsOptional()
  @IsString()
  designSuggestion?: string;

  @IsOptional()
  @IsString()
  valueSuggestion?: string;
}
