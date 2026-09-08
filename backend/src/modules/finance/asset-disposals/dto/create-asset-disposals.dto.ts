import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDisposalsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  assetId: string;

  @ApiProperty({ example: "2026-09-08" })
  disposalDate: string;

  @ApiProperty({ example: "SALE" })
  disposalType: string;

  @ApiProperty({ example: 50000000 })
  proceeds: number;

  @ApiProperty({ example: -5000000 })
  gainLoss: number;
}
