import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBillMatchResultDto {
  @ApiProperty({ example: 'uuid', description: 'Bill being matched' })
  @IsUUID()
  billId: string;

  @ApiProperty({ example: 10, description: 'Original PO qty' })
  @IsNumber()
  @Min(0.01)
  orderedQty: number;

  @ApiProperty({ example: 10, description: 'Actual received qty (GR)' })
  @IsNumber()
  @Min(0)
  actualQty: number;

  @ApiProperty({ example: 85000, description: 'Original PO price' })
  @IsNumber()
  @Min(0)
  poPrice: number;

  @ApiProperty({ example: 85000, description: 'Actual invoice price' })
  @IsNumber()
  @Min(0)
  actualPrice: number;

  @ApiProperty({ example: 'All matched, no variance', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
