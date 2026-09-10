import { ApiProperty } from '@nestjs/swagger';

export class CreateApPaymentsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'BPB-2609-0001' })
  paymentNumber: string;

  @ApiProperty({ example: 'uuid' })
  vendorId: string;

  @ApiProperty({ example: '2026-09-08' })
  paymentDate: string;

  @ApiProperty({ example: 1000000 })
  amount: number;

  @ApiProperty({ example: 'uuid' })
  bankAccountId: string;
}
