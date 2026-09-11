import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateSampleFeeDto {
  @ApiProperty({ example: 'uuid', description: 'Customer (Prospect/Customer master)' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 250000, description: 'Fee amount in IDR' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2026-09-10', required: false })
  @IsOptional()
  @IsDateString()
  feeDate?: string;

  @ApiProperty({ example: 'Sample production cost for SKU-X123', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LinkSampleFeeToDpDto {
  @ApiProperty({ example: 'uuid', description: 'Down Payment ID to offset against' })
  @IsUUID()
  dpId: string;
}
