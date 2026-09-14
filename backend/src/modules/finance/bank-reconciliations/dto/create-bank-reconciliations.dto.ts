import { ApiProperty } from '@nestjs/swagger';

export class CreateBankReconciliationsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  bankAccountId: string;

  @ApiProperty({ example: '2026-09-01' })
  periodStart: string;

  @ApiProperty({ example: '2026-09-30' })
  periodEnd: string;

  @ApiProperty({ example: 100000000 })
  statementBalance: number;

  @ApiProperty({ example: 100000000 })
  bookBalance: number;

  @ApiProperty({ example: 0 })
  diff: number;

  @ApiProperty({ example: 'IN_PROGRESS' })
  status: string;
}
