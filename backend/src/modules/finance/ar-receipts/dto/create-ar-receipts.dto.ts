import { ApiProperty } from '@nestjs/swagger';

export class CreateArReceiptsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ARC-2609-0001' })
  receiptNumber: string;

  @ApiProperty({ example: 'uuid' })
  customerId: string;

  @ApiProperty({ example: 'uuid' })
  invoiceId: string;

  @ApiProperty({ example: '2026-09-08' })
  receiptDate: string;

  @ApiProperty({ example: 1000000 })
  amount: number;

  @ApiProperty({ example: 'uuid' })
  bankAccountId: string;
}
