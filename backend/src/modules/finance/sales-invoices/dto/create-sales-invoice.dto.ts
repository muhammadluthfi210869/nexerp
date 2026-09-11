import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsArray, ValidateNested, Min, ArrayMinSize, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesInvoiceLineItemDto {
  @ApiProperty({ example: 'PRD-001' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 'Brightening Serum 30ml' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.01)
  qty: number;

  @ApiProperty({ example: 'pcs' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateSalesInvoiceDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiProperty({ example: '2026-10-08' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'Invoice for SO-2026-0099', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [SalesInvoiceLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceLineItemDto)
  @ArrayMinSize(1)
  lineItems: SalesInvoiceLineItemDto[];
}

export class CancelSalesInvoiceDto {
  @ApiProperty({ example: 'Customer cancelled order' })
  @IsString()
  @MinLength(5)
  reason: string;
}
