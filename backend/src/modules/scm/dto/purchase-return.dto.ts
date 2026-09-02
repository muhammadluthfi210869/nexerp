import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseReturnItemDto {
  @IsUUID()
  @IsNotEmpty()
  materialId!: string;

  @IsNotEmpty()
  quantity!: number;

  @IsNotEmpty()
  unitPrice!: number;
}

export class CreatePurchaseReturnDto {
  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;

  @IsUUID()
  @IsNotEmpty()
  warehouseId!: string;

  @IsUUID()
  @IsOptional()
  inboundId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items!: CreatePurchaseReturnItemDto[];
}

export class UpdatePurchaseReturnStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: any; // PurchaseReturnStatus
}
