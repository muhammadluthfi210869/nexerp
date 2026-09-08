import { ApiProperty } from '@nestjs/swagger';

export class CreateDepreciationSchedulesDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  assetId: string;

  @ApiProperty({ example: "2026-09-01" })
  period: string;

  @ApiProperty({ example: 5833333 })
  amount: number;

  @ApiProperty({ example: 5833333 })
  accumulated: number;
}
