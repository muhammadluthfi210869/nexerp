import { ApiProperty } from '@nestjs/swagger';

export class CreateProductProfitabilitiesDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  productId: string;

  @ApiProperty({ example: 'Product X' })
  productName: string;

  @ApiProperty({ example: '2026-09-01' })
  period: string;

  @ApiProperty({ example: 50000000 })
  revenue: number;

  @ApiProperty({ example: 30000000 })
  cost: number;

  @ApiProperty({ example: 20000000 })
  profit: number;

  @ApiProperty({ example: 0.4 })
  margin: number;
}
