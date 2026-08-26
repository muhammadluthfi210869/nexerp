import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundStatus } from '@prisma/client';

export class InboundItemDto {
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsNumber()
  @IsPositive()
  qtyActual!: number;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsDateString()
  expDate?: string;
}

export class CreateInboundDto {
  @IsString()
  @IsNotEmpty()
  poId!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  supplierReference?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboundItemDto)
  items!: InboundItemDto[];
}

export class UpdateInboundStatusDto {
  @IsEnum(InboundStatus)
  @IsNotEmpty()
  status!: InboundStatus;
}

export class QcValidateItemDto {
  @IsString()
  @IsNotEmpty()
  inboundItemId!: string;

  @IsString()
  @IsNotEmpty()
  qcStatus!: string; // QCStatus enum value: GOOD | QUARANTINE | REJECT
}

export class QcValidateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QcValidateItemDto)
  items!: QcValidateItemDto[];
}
