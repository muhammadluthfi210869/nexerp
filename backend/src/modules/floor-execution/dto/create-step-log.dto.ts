import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ProdStage } from '@prisma/client';

export class CreateStepLogDto {
  @IsUUID()
  @IsNotEmpty()
  workOrderId!: string;

  @IsNotEmpty()
  stage!: any; // Use String/Any to match WorkOrderStage or ProdStage

  @IsNumber()
  @IsNotEmpty()
  inputQty!: number;

  @IsNumber()
  @IsNotEmpty()
  goodQty!: number;

  @IsNumber()
  @IsNotEmpty()
  rejectQty!: number;

  @IsNumber()
  @IsNotEmpty()
  quarantineQty!: number;

  @IsOptional()
  @IsUUID()
  machineId?: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @IsOptional()
  startTime?: Date;

  @IsOptional()
  endTime?: Date;

  @IsOptional()
  machineParams?: any;

  @IsOptional()
  materialBatchNumber?: string;

  @IsOptional()
  notes?: string;
}
