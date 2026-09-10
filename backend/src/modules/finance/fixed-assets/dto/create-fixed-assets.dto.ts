import { ApiProperty } from '@nestjs/swagger';

export class CreateFixedAssetsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'FA-2026-0001' })
  assetNumber: string;

  @ApiProperty({ example: 'Mobil Alphard' })
  assetName: string;

  @ApiProperty({ example: 'Kendaraan' })
  assetCategory: string;

  @ApiProperty({ example: '2026-01-15' })
  acquisitionDate: string;

  @ApiProperty({ example: 400000000 })
  acquisitionCost: number;

  @ApiProperty({ example: 60 })
  usefulLife: number;

  @ApiProperty({ example: 50000000 })
  salvageValue: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
