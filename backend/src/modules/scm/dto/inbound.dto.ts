import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundStatus } from '@prisma/client';

export class InboundItemDto {
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsOptional()
  @IsNumber()
  qtyActual?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  qtyGood?: number;

  @IsOptional()
  @IsNumber()
  qtyReject?: number;

  @IsOptional()
  @IsNumber()
  qtyFree?: number;

  @IsOptional()
  @IsString()
  notes?: string;
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
  doNumber?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

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
