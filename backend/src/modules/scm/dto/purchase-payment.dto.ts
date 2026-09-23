import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BillAllocationDto {
  @IsUUID()
  billId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class CreatePurchasePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  billId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  receivingAccountId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillAllocationDto)
  allocations?: BillAllocationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class CreateDownPaymentDto {
  @IsUUID()
  vendorId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
