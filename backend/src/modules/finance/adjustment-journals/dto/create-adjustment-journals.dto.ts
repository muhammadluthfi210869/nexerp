import { ApiProperty } from '@nestjs/swagger';

export class CreateAdjustmentJournalsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'AJ-2609-0001' })
  journalNumber: string;

  @ApiProperty({ example: '2026-09-01' })
  period: string;

  @ApiProperty({ example: 'Accrual adjustment', required: false })
  description?: string;

  @ApiProperty({ example: 5000000 })
  totalAmount: number;
}
