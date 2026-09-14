import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsIn, IsDateString, Min } from 'class-validator';

export class CreateBankTransactionDto {
  @ApiProperty({ example: 'uuid', description: 'Bank account ID' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    example: 'DEPOSIT',
    enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADJUSTMENT'],
  })
  @IsIn(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADJUSTMENT'])
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'ADJUSTMENT';

  @ApiProperty({ example: 1500000, description: 'Amount in IDR (always positive)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Bank fees September 2026' })
  @IsString()
  description: string;

  @ApiProperty({ example: ['https://storage/receipt.pdf'], required: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class ReconcileBankTransactionDto {
  @ApiProperty({ example: 'uuid', required: false, description: 'Bank reconciliation session ID' })
  @IsOptional()
  @IsUUID()
  reconciliationId?: string;

  @ApiProperty({ example: 'Matched against Sept statement line 12', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
