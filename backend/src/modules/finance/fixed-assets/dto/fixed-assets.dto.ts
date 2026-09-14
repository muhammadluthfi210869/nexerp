import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsPositive, Min, MinLength } from 'class-validator';

export class CreateFixedAssetDto {
  @ApiProperty({ example: 'FA-2609-0001', required: false, description: 'Auto-generated if omitted' })
  @IsOptional()
  @IsString()
  assetNumber?: string;

  @ApiProperty({ example: 'Toyota Innova 2024' })
  @IsString()
  @MinLength(3)
  assetName: string;

  @ApiProperty({ example: 'Kendaraan', description: 'Free-text category (Kendaraan, Peralatan, Bangunan, dll)' })
  @IsString()
  assetCategory: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  acquisitionDate: string;

  @ApiProperty({ example: 250000000, description: 'Acquisition cost in IDR' })
  @IsNumber()
  @IsPositive()
  acquisitionCost: number;

  @ApiProperty({ example: 60, description: 'Useful life in months (e.g., 60 = 5 years)' })
  @IsNumber()
  @Min(1)
  usefulLife: number;

  @ApiProperty({ example: 50000000, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @ApiProperty({ example: 'Kantor Pusat Jakarta', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'Pak Budi', required: false })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiProperty({ example: 'Untuk operasional direksi', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFixedAssetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assetName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assetCategory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
