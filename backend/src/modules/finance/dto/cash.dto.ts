import {
  IsString,
  IsNumber,
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export enum CashDisburseCategory {
  UANG_MUKA_PEMBELIAN = 'UANG_MUKA_PEMBELIAN',
  BAYAR_UTANG = 'BAYAR_UTANG',
  BEBAN_OPERASIONAL = 'BEBAN_OPERASIONAL',
  PEMBELIAN_ASET = 'PEMBELIAN_ASET',
  LAINNYA = 'LAINNYA',
}

export enum CashReceiveCategory {
  PENERIMAAN_PIUTANG = 'PENERIMAAN_PIUTANG',
  DP_PENJUALAN = 'DP_PENJUALAN',
  PENDAPATAN_LAIN = 'PENDAPATAN_LAIN',
  MODAL = 'MODAL',
  LAINNYA = 'LAINNYA',
}

export class CashDisburseDto {
  @IsDateString()
  date!: string;

  @IsUUID()
  cashAccountId!: string;

  @IsEnum(CashDisburseCategory)
  category!: CashDisburseCategory;

  @IsUUID()
  debitAccountId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  entityName!: string;

  @IsString()
  notes!: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class CashReceiveDto {
  @IsDateString()
  date!: string;

  @IsUUID()
  cashAccountId!: string;

  @IsEnum(CashReceiveCategory)
  category!: CashReceiveCategory;

  @IsUUID()
  creditAccountId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  entityName!: string;

  @IsString()
  notes!: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bankAdminFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsUUID()
  taxAccountId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
