import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
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

  @IsString({ message: 'SO_CATEGORY_REQUIRED: Kategori penjualan wajib diisi.' })
  @IsNotEmpty({ message: 'SO_CATEGORY_REQUIRED: Kategori penjualan wajib diisi.' })
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
  @IsOptional()
  totalAmount?: number;

  @IsArray({ message: 'CART_EMPTY: Sales order harus memiliki minimal 1 item produk.' })
  @ArrayMinSize(1, { message: 'CART_EMPTY: Sales order harus memiliki minimal 1 item produk.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items!: CreateSalesOrderItemDto[];
}
