import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxTransactionsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  taxTypeId: string;

  @ApiProperty({ example: "BILL" })
  sourceType: string;

  @ApiProperty({ example: "uuid" })
  sourceId: string;

  @ApiProperty({ example: 110000 })
  amount: number;

  @ApiProperty({ example: "2026-09-08" })
  transactionDate: string;
}
