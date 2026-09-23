import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseInvoiceLineItemDto {
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsOptional()
  @IsString()
  itemCode?: string;

  @IsString()
  @IsOptional()
  itemName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  qty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  rejectQty?: number;
}

export class CreatePurchaseInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  inboundId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  grId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  poId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pic?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  procurementCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dpAmountToApply?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  downPaymentDeduction?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dpId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  downPaymentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  items?: PurchaseInvoiceLineItemDto[];
}
