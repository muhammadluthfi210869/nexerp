import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsPositive, Min, MinLength } from 'class-validator';

export class CreateIntangibleAssetDto {
  @ApiProperty({ example: 'IA-2609-0001', required: false })
  @IsOptional()
  @IsString()
  assetNumber?: string;

  @ApiProperty({ example: 'Microsoft 365 Business License' })
  @IsString()
  @MinLength(3)
  assetName: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  acquisitionDate: string;

  @ApiProperty({ example: 25000000 })
  @IsNumber()
  @IsPositive()
  acquisitionCost: number;

  @ApiProperty({ example: 36, description: 'Amortization period in months (e.g., 36 = 3 years)' })
  @IsNumber()
  @Min(1)
  amortizationPeriod: number;

  @ApiProperty({ example: 'STRAIGHT_LINE', required: false, default: 'STRAIGHT_LINE' })
  @IsOptional()
  @IsString()
  amortizationMethod?: string;

  @ApiProperty({ example: '5 seats, renewable', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
