import { ApiProperty } from '@nestjs/swagger';

export class CreateBankAccountsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "BCA-001" })
  accountCode: string;

  @ApiProperty({ example: "BCA" })
  bankName: string;

  @ApiProperty({ example: "PT Sample Operating" })
  accountName: string;

  @ApiProperty({ example: "123-456-7890" })
  accountNumber: string;

  @ApiProperty({ example: 100000000 })
  currentBalance: number;
}
