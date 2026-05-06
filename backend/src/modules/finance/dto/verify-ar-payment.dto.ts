import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum ArPaymentType {
  SAMPLE = 'SAMPLE',
  DP_ORDER = 'DP_ORDER',
  PELUNASAN = 'PELUNASAN',
  PNBP = 'PNBP',
}

export class VerifyArPaymentDto {
  @IsEnum(ArPaymentType)
  type!: ArPaymentType;

  @IsString()
  id!: string;

  @IsString()
  receivingAccountId!: string;

  @IsNumber()
  actualAmount!: number;

  @IsNumber()
  bankAdminFee!: number;

  @IsNumber()
  taxAmount!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
