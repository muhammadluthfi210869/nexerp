import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsArray, Min } from 'class-validator';

export class CreateApPaymentDto {
  @ApiProperty({ example: 'uuid', description: 'Vendor/Supplier ID' })
  @IsUUID()
  vendorId: string;

  @ApiProperty({ example: 2500000, description: 'Total payment amount in IDR' })
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ example: 'uuid', description: 'Source bank account ID', required: false })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiProperty({ example: 'Payment for PO-2026-0099', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: ['https://.../invoice.pdf'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class AllocateApPaymentDto {
  @ApiProperty({ example: 'uuid', description: 'Bill ID to allocate payment to' })
  @IsUUID()
  billId: string;

  @ApiProperty({ example: 1500000, description: 'Amount to allocate to this bill' })
  @IsNumber()
  @Min(1)
  amount: number;
}
