import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsIn, Min, Max } from 'class-validator';

export class CreateTaxTransactionDto {
  @ApiProperty({ example: 'uuid', description: 'Tax rate (PPN 11%, PPh 23, etc.)' })
  @IsUUID()
  taxTypeId: string;

  @ApiProperty({
    example: 'BILL',
    enum: ['BILL', 'SALES_INVOICE', 'PAYMENT'],
  })
  @IsIn(['BILL', 'SALES_INVOICE', 'PAYMENT'])
  sourceType: 'BILL' | 'SALES_INVOICE' | 'PAYMENT';

  @ApiProperty({ example: 'uuid', description: 'Source document ID' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ example: 1000000, description: 'Taxable base amount' })
  @IsNumber()
  @Min(1)
  baseAmount: number;

  @ApiProperty({ example: 11, description: 'Tax rate percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;

  @ApiProperty({
    example: 110000,
    description: 'Tax amount (auto-calculated if omitted)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({ example: 'PPN on PO-2026-1234', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReportTaxDto {
  @ApiProperty({ example: '2026-09', description: 'Reporting period (e.g., 2026-09)' })
  @IsString()
  reportPeriod: string;

  @ApiProperty({ example: 'Filed via e-Faktur', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayTaxDto {
  @ApiProperty({ example: 'TAX-PAY-2026-09-001', required: false })
  @IsOptional()
  @IsString()
  paymentRef?: string;

  @ApiProperty({ example: 'BCA transfer ref 98765', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
