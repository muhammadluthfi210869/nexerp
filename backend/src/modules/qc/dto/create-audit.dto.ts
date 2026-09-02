import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { QCStatus, QcInspectionPhase } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateQCAuditDto {
  @IsUUID()
  @IsOptional()
  stepLogId?: string;

  @IsUUID()
  @IsOptional()
  inventoryId?: string;

  @IsUUID()
  @IsOptional()
  inboundItemId?: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsEnum(QCStatus)
  @IsNotEmpty()
  status!: QCStatus;

  @IsEnum(QcInspectionPhase)
  @IsOptional()
  phase?: QcInspectionPhase;

  @IsString()
  @IsOptional()
  notes?: string;

  // --- Parameter Hasil Ukur ---
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  ph?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  viscosity?: number;

  @IsString()
  @IsOptional()
  organoleptic?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  fillingWeight?: number;

  @IsString()
  @IsOptional()
  sealingCheck?: string;

  @IsString()
  @IsOptional()
  labelingCheck?: string;

  @IsString()
  @IsOptional()
  expDateCheck?: string;

  @IsString()
  @IsOptional()
  halalStatus?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  densityValue?: number;

  @IsString()
  @IsOptional()
  homogenityPass?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  torqueValue?: number;

  @IsString()
  @IsOptional()
  leakTestPass?: string;

  @IsString()
  @IsOptional()
  dimensionCheck?: string;

  @IsString()
  @IsOptional()
  coaVerified?: string;

  // --- Detail Defect ---
  @IsString()
  @IsOptional()
  defectCategory?: string;

  @IsString()
  @IsOptional()
  defectType?: string;

  @IsString()
  @IsOptional()
  defectLocation?: string;

  @IsString()
  @IsOptional()
  defectCause?: string;

  @IsString()
  @IsOptional()
  severity?: string;

  @IsString()
  @IsOptional()
  disposition?: string;

  @IsString()
  @IsOptional()
  rootCause?: string;

  @IsString()
  @IsOptional()
  correctiveAction?: string;

  @IsString()
  @IsOptional()
  materialBatchNo?: string;

  // --- Supervisor Bypass ---
  @IsString()
  @IsOptional()
  supervisorPin?: string;

  @IsString()
  @IsOptional()
  bypassReason?: string;
}
