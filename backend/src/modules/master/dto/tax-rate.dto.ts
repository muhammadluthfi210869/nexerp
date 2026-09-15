import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxRateDto {
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Tax percentage (e.g., 11.00 for PPN 11%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTaxRateDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}