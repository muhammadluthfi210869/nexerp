import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShipStatus } from '@prisma/client';

export class CreateShipmentItemDto {
  @IsNotEmpty()
  @IsUUID()
  materialId!: string;

  @IsNumber()
  @IsPositive()
  qtyShipped!: number;
}

export class CreateShipmentDto {
  @IsNotEmpty()
  @IsUUID()
  soId!: string;

  @IsNotEmpty()
  @IsUUID()
  logisticsId!: string;

  @IsOptional()
  @IsString()
  trackingNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Optional idempotency key for retries on create.
   * If a shipment with this commandKey already exists, returns the existing one.
   */
  @IsOptional()
  @IsString()
  commandKey?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentItemDto)
  items?: CreateShipmentItemDto[];
}

export class UpdateShipmentStatusDto {
  @IsNotEmpty()
  @IsEnum(ShipStatus)
  status!: ShipStatus;

  /**
   * Optional idempotency key for retries on status transition.
   * Re-applying SHIPPED will NOT double-decrement finished stock.
   */
  @IsOptional()
  @IsString()
  commandKey?: string;
}