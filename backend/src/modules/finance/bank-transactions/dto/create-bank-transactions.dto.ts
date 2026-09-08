import { ApiProperty } from '@nestjs/swagger';

export class CreateBankTransactionsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  bankAccountId: string;

  @ApiProperty({ example: "2026-09-08" })
  date: string;

  @ApiProperty({ example: 500000 })
  amount: number;

  @ApiProperty({ example: "DEBIT" })
  type: string;

  @ApiProperty({ example: "Payment received", required: false })
  description?: string;

  @ApiProperty({ example: "AR_RECEIPT" })
  sourceType: string;
}
