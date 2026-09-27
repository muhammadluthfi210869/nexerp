import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PRPriority, PRStatus } from '@prisma/client';

export class PurchaseRequestItemDto {
  @IsUUID()
  @IsNotEmpty()
  materialId: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  qtyRequired?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseRequestDto {
  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsEnum(PRPriority)
  priority?: PRPriority;

  @IsOptional()
  @IsString()
  budgetCode?: string;

  @IsOptional()
  @IsString()
  urgency?: string; // CRITICAL, NORMAL, LOW

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  items: PurchaseRequestItemDto[];
}

export class UpdatePurchaseRequestStatusDto {
  @IsEnum(PRStatus)
  status: PRStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}
