import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddBillLineItemDto {
  @ApiProperty({ example: 'BBK00028' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: 'Beeswax pellets' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 5.5 })
  @IsNumber()
  @Min(0.01)
  qty: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class UpdateBillLineItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  qty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ example: 0.5, required: false, description: 'Qty rejected by QC' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectQty?: number;
}
