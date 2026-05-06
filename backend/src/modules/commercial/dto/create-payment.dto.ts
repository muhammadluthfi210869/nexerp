import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @IsNumber()
  @IsNotEmpty()
  amountPaid!: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}
