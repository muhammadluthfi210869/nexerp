import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsArray, Min } from 'class-validator';

export class CreateArReceiptDto {
  @ApiProperty({ example: 'uuid', description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'uuid', description: 'Sales invoice ID to apply to (optional, can allocate later)', required: false })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({ example: 1500000, description: 'Receipt amount in IDR' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 15000, description: 'PPh 23 withholding (if applicable)', required: false })
  @IsOptional()
  @IsNumber()
  pph23Amount?: number;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @ApiProperty({ example: 'uuid', description: 'Destination bank account ID', required: false })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiProperty({ example: 'Payment for INV-2026-0099', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: ['https://.../receipt.pdf'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class AllocateArReceiptDto {
  @ApiProperty({ example: 'uuid', description: 'Sales invoice ID' })
  @IsUUID()
  invoiceId: string;
}
