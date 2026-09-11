import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'BCA-001' })
  @IsString()
  @MinLength(3)
  accountCode: string;

  @ApiProperty({ example: 'BCA' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: '123-456-7890' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'BANK', enum: ['BANK', 'CASH', 'PETTY_CASH'] })
  @IsIn(['BANK', 'CASH', 'PETTY_CASH'])
  accountType: 'BANK' | 'CASH' | 'PETTY_CASH';

  @ApiProperty({ example: 'IDR', required: false, default: 'IDR' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiProperty({ example: 'uuid', description: 'Linked GL account', required: false })
  @IsOptional()
  @IsUUID()
  glAccountId?: string;

  @ApiProperty({ example: 10000000, required: false })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @ApiProperty({ example: 'Main operating account', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBankAccountDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  glAccountId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReconcileBankAccountDto {
  @ApiProperty({ example: 15000000, description: 'Actual balance from bank statement' })
  @IsNumber()
  actualBalance: number;

  @ApiProperty({ example: 'September 2026 statement' })
  @IsString()
  @MinLength(5)
  notes: string;
}
