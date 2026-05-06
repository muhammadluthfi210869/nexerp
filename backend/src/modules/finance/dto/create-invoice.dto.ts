import {
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsPositive,
  Min,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber!: string;

  @IsString()
  customerName!: string;

  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsNumber()
  @Min(0)
  outstandingAmount!: number;

  @IsDateString()
  dueDate!: string;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}
