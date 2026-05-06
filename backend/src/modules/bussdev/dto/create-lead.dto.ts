import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType, HkiMode, ProductCategory } from '@prisma/client';

export class CreateSampleRequestDto {
  @IsString()
  productName!: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateLeadDto {
  @IsString()
  clientName!: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsString()
  contactInfo!: string;

  @IsString()
  source!: string;

  @IsString()
  productInterest!: string;

  @Type(() => Number)
  @IsNumber()
  estimatedValue!: number;

  @IsOptional()
  @IsUUID()
  picId?: string;

  @IsOptional()
  @IsBoolean()
  isRepeatOrder?: boolean;

  @IsOptional()
  @IsEnum(HkiMode)
  hkiMode?: HkiMode;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  addressDetail?: string;

  @IsOptional()
  @IsString()
  launchingPlan?: string;

  @IsOptional()
  @IsString()
  targetMarket?: string;

  @IsOptional()
  @IsString()
  contactChannel?: string;

  @IsOptional()
  @IsString()
  packagingSuggestion?: string;

  @IsOptional()
  @IsString()
  designSuggestion?: string;

  @IsOptional()
  @IsString()
  valueSuggestion?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  moq?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  planOmset?: number;

  @IsOptional()
  @IsNumber()
  logoRevision?: number;

  @IsOptional()
  @IsString()
  hkiProgress?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSampleRequestDto)
  sampleRequests?: CreateSampleRequestDto[];
}
