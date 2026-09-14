import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateBankReconciliationDto {
  @ApiProperty({ example: 'uuid', description: 'Bank account being reconciled' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ example: '2026-09-01', description: 'Start of reconciliation period' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-09-30', description: 'End of reconciliation period' })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({
    example: 50000000,
    description: 'Actual ending balance from bank statement',
  })
  @IsNumber()
  statementBalance: number;

  @ApiProperty({ example: ['https://storage/statement.pdf'], required: false })
  @IsOptional()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiProperty({ example: 'September 2026 monthly reconciliation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FinalizeReconciliationDto {
  @ApiProperty({ example: 'All lines matched against statement', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
