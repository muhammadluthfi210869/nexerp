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

  // BATCH 3 (corrected): formulaId is OPTIONAL. If omitted, the backend
  // auto-resolves the currently eligible Formula from the sample's lineage
  // (the same one the Legalitas pipeline was pinned to). If provided,
  // it must belong to the sample, not be SUPERSEDED, and not conflict
  // with the pipeline's pin.
  @IsUUID()
  @IsOptional()
  formulaId?: string;

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

  // BATCH 3 (corrected): idempotency token. If supplied, the SO is
  // unique on (leadId, sampleId, formulaId, idempotencyKey) — a retry
  // returns the existing row. If OMITTED, every create produces a new
  // SO row, so legitimate repeat orders with the same formula are
  // preserved (INV-07). The UI should send a fresh token per submission.
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

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
