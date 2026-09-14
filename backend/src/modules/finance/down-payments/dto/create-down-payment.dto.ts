import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateDownPaymentDto {
  @ApiProperty({ example: 'uuid', description: 'Vendor/Supplier ID' })
  @IsUUID()
  vendorId: string;

  @ApiProperty({ example: 500000, description: 'DP amount in IDR' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  dpDate?: string;

  @ApiProperty({ example: 'DP for PO-2026-0099', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PostDownPaymentDto {
  @ApiProperty({ example: 'uuid', description: 'Source bank account ID for the payment' })
  @IsUUID()
  bankAccountId: string;
}

export class ApplyDownPaymentDto {
  @ApiProperty({ example: 'uuid', description: 'Bill ID to apply DP to' })
  @IsUUID()
  billId: string;

  @ApiProperty({ example: 200000, description: 'Amount to apply (cannot exceed remaining)' })
  @IsNumber()
  @Min(1)
  applyAmount: number;
}

export class CancelDownPaymentDto {
  @ApiProperty({ example: 'Vendor cancelled order' })
  @IsString()
  reason: string;
}
