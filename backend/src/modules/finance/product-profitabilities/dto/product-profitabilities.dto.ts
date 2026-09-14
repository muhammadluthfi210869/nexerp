import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class UpsertProductProfitabilityDto {
  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'Lipstick Matte Red' })
  @IsString()
  productName: string;

  @ApiProperty({ example: '2026-09-01', description: 'Period start (YYYY-MM-DD)' })
  @IsDateString()
  period: string;

  @ApiProperty({ example: 25000000 })
  @IsNumber()
  @Min(0)
  revenue: number;

  @ApiProperty({ example: 15000000 })
  @IsNumber()
  @Min(0)
  cost: number;
}
