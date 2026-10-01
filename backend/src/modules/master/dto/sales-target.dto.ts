import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalesTargetDto {
  @ApiProperty({ description: 'User ID of Sales / Marketing PIC', example: '9756079e-0681-4d59-a2f4-bab16722581e' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Target Month (1 - 12)', example: 3 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Target Year', example: 2026 })
  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Nominal Revenue Target in IDR', example: 500000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  nominalTarget: number;

  @ApiPropertyOptional({ description: 'Optional operational notes/strategy', example: 'Focus on Maklon Skincare Q1' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSalesTargetDto {
  @ApiPropertyOptional({ description: 'Target Month (1 - 12)', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Target Year', example: 2026 })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Nominal Revenue Target in IDR', example: 600000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nominalTarget?: number;

  @ApiPropertyOptional({ description: 'Optional operational notes/strategy', example: 'Revised target for Q1' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSalesCategoryDto {
  @ApiProperty({ description: 'Category Name', example: 'Maklon Baru' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category Description', example: 'Proyek Maklon Produk Baru / NPD' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSalesCategoryDto {
  @ApiPropertyOptional({ description: 'Category Name', example: 'Maklon Baru (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Category Description', example: 'Proyek Maklon Produk Baru' })
  @IsOptional()
  @IsString()
  description?: string;
}
