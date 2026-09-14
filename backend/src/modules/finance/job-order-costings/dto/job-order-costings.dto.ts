import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';

export class CreateJobOrderCostingDto {
  @ApiProperty({ example: 'JO-2026-09-0001' })
  @IsString()
  @MinLength(3)
  jobOrderNumber: string;

  @ApiProperty({ example: 'Lipstick batch September week 3', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5500000 })
  @IsNumber()
  @Min(1)
  totalCost: number;

  @ApiProperty({ example: 8000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalRevenue?: number;
}

export class UpdateJobOrderTotalsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalRevenue?: number;
}
