import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { InvoiceType } from '@prisma/client';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  id!: string; // INV-SO-XXX-DP

  @IsString()
  @IsNotEmpty()
  soId!: string;

  @IsEnum(InvoiceType)
  @IsNotEmpty()
  type!: InvoiceType;

  @IsNumber()
  @IsNotEmpty()
  amountDue!: number;
}
