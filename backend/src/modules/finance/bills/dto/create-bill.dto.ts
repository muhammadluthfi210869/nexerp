import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsArray, ValidateNested, Min, ArrayMinSize, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class BillLineItemDto {
  @ApiProperty({ example: 'RM-001' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 'Niacinamide Powder' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0.01)
  qty: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateBillDto {
  @ApiProperty({ example: 'PO-2026-0099', required: false })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  vendorId: string;

  @ApiProperty({ example: 'Bahan Baku (11510)', description: 'COA category code' })
  @IsString()
  procurementCategory: string;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiProperty({ example: '2026-10-08' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'Arie', description: 'Person in charge' })
  @IsString()
  pic: string;

  @ApiProperty({ example: 'Bill for PO-2026-0099', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [BillLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillLineItemDto)
  @ArrayMinSize(1)
  lineItems: BillLineItemDto[];
}

export class CancelBillDto {
  @ApiProperty({ example: 'Vendor cancelled order' })
  @IsString()
  @MinLength(5)
  reason: string;
}
