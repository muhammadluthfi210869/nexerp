import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { QCStatus } from '@prisma/client';

export class CreateQCAuditDto {
  @IsUUID()
  @IsOptional()
  stepLogId?: string;

  @IsUUID()
  @IsOptional()
  inventoryId?: string;

  @IsEnum(QCStatus)
  @IsNotEmpty()
  status!: QCStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  ph?: number;

  @IsNumber()
  @IsOptional()
  viscosity?: number;

  @IsString()
  @IsOptional()
  organoleptic?: string;

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

  @IsString()
  @IsOptional()
  isCompliancePassed?: string;
}
