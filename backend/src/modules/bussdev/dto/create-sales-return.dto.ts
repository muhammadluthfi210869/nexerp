import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesReturnItemDto {
  @IsUUID()
  materialId!: string;

  @Type(() => Number)
  @IsNumber()
  qtyOriginal!: number;

  @Type(() => Number)
  @IsNumber()
  qtyReturned!: number;
}

export class CreateSalesReturnDto {
  @IsUUID()
  soId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsDateString()
  returnDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  returnStatus?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnItemDto)
  items!: CreateSalesReturnItemDto[];
}
