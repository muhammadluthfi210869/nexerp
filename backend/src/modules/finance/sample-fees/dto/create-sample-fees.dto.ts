import { ApiProperty } from '@nestjs/swagger';

export class CreateSampleFeesDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "SF-2609-0001" })
  feeNumber: string;

  @ApiProperty({ example: "uuid" })
  customerId: string;

  @ApiProperty({ example: 500000 })
  amount: number;

  @ApiProperty({ example: "2026-09-08" })
  feeDate: string;
}
