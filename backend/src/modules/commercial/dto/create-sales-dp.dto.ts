import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class CreateSalesDpDto {
  @IsUUID()
  @IsNotEmpty()
  soId!: string;

  @IsString()
  @IsIn(['SAMPLE', 'LEGALITAS', 'PRODUKSI'], {
    message: 'DP_CATEGORY_REQUIRED: Kategori DP harus salah satu dari: SAMPLE, LEGALITAS, PRODUKSI',
  })
  category!: 'SAMPLE' | 'LEGALITAS' | 'PRODUKSI';

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsOptional()
  @IsBoolean()
  applySampleFeeOffset?: boolean;

  @IsOptional()
  @IsUUID()
  sampleFeeId?: string;

  @IsOptional()
  @IsUUID()
  coaId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
