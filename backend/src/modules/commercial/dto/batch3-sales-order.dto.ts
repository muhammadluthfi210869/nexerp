import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Batch3CreateSOItemDto {
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  netto?: number;

  @IsUUID()
  @IsOptional()
  taxId?: string;
}

export class Batch3CreateSODto {
  @IsUUID()
  leadId!: string;

  @IsUUID()
  sampleId!: string;

  // BATCH 3 — required. Pin exact formula version. INV-09.
  @IsUUID()
  formulaId!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  totalAmount!: number;

  @IsString()
  @IsOptional()
  salesCategory?: string;

  @IsString()
  @IsOptional()
  brandName?: string;

  @IsUUID()
  @IsOptional()
  taxId?: string;

  @IsUUID()
  @IsOptional()
  currencyId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Batch3CreateSOItemDto)
  items!: Batch3CreateSOItemDto[];
}

export class Batch3AmendSODto {
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsUUID()
  @IsOptional()
  formulaId?: string;

  // EXCEPTION INPUT — required when quantity/totalAmount/formulaId change.
  @IsString()
  @IsOptional()
  reason?: string;
}
