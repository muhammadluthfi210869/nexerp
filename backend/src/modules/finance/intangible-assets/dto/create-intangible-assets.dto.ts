import { ApiProperty } from '@nestjs/swagger';

export class CreateIntangibleAssetsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'IA-2026-0001' })
  assetNumber: string;

  @ApiProperty({ example: 'SAP License' })
  assetName: string;

  @ApiProperty({ example: '2026-01-01' })
  acquisitionDate: string;

  @ApiProperty({ example: 50000000 })
  acquisitionCost: number;

  @ApiProperty({ example: 36 })
  amortizationPeriod: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
