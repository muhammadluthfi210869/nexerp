import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class IssueRequisitionDto {
  @IsNumber()
  @IsNotEmpty()
  qtyIssued!: number;
}

export class CreateRequisitionDto {
  @IsOptional()
  @IsUUID()
  woId?: string;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsString()
  woNumber?: string;

  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsOptional()
  @IsNumber()
  qtyRequested?: number;

  @IsOptional()
  @IsNumber()
  requestedQty?: number;

  @IsOptional()
  @IsString()
  reqNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
