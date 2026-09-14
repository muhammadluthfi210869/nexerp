import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsIn, IsDateString, Min } from 'class-validator';

export class CreateCostAllocationDto {
  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  allocationDate: string;

  @ApiProperty({ example: 5000000, description: 'Amount to allocate (IDR)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'CC-OVERHEAD' })
  @IsString()
  fromCostCenter: string;

  @ApiProperty({ example: 'CC-PRODUCTION' })
  @IsString()
  toCostCenter: string;

  @ApiProperty({ example: 'DIRECT', enum: ['DIRECT', 'STEP_DOWN', 'RECIPROCAL'], required: false })
  @IsOptional()
  @IsIn(['DIRECT', 'STEP_DOWN', 'RECIPROCAL'])
  allocationMethod?: 'DIRECT' | 'STEP_DOWN' | 'RECIPROCAL';

  @ApiProperty({ example: 'square_feet', required: false })
  @IsOptional()
  @IsString()
  basis?: string;

  @ApiProperty({ example: 'Q3 overhead allocation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
