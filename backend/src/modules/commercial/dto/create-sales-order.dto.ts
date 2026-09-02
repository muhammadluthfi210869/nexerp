import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  materialId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  netto?: number;

  @IsUUID()
  @IsOptional()
  taxId?: string;
}

export class CreateSalesOrderDto {
  @IsUUID()
  @IsNotEmpty()
  leadId!: string;

  @IsUUID()
  @IsNotEmpty()
  sampleId!: string;

  @IsString()
  @IsNotEmpty()
  salesCategory!: string;

  @IsString()
  @IsOptional()
  brandName?: string;

  @IsUUID()
  @IsOptional()
  taxId?: string;

  @IsUUID()
  @IsOptional()
  currencyId?: string;

  @IsNumber()
  @IsNotEmpty()
  totalAmount!: number;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items!: CreateSalesOrderItemDto[];
}
