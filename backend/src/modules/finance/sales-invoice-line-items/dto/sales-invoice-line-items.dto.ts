import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddSalesInvoiceLineItemDto {
  @ApiProperty({ example: 'PRD001' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 'Lipstick Matte Red' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.01)
  qty: number;

  @ApiProperty({ example: 'pcs' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 55000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class UpdateSalesInvoiceLineItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  qty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discount?: number;
}
