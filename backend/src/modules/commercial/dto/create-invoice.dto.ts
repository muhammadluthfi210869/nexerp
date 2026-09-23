import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { InvoiceType } from '@prisma/client';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  id!: string; // INV-SO-XXX-DP or INV-XXXX

  @IsString()
  @IsNotEmpty()
  soId!: string;

  @IsEnum(InvoiceType)
  @IsNotEmpty()
  type!: InvoiceType;

  @IsNumber()
  @IsNotEmpty()
  amountDue!: number;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsBoolean()
  overrideCreditLimit?: boolean;

  @IsOptional()
  @IsString()
  overrideReason?: string;
}
