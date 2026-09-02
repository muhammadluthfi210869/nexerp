import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { MaterialType, MaterialUnit } from '@prisma/client';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(MaterialType)
  @IsNotEmpty()
  type!: MaterialType;

  @IsString() // Changed from IsEnum(MaterialUnit) if it doesn't exist in schema
  @IsNotEmpty()
  unit!: string;

  @IsNumber()
  @IsNotEmpty()
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  stockQty?: number;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  inventoryAccountId?: string;

  @IsString()
  @IsOptional()
  salesAccountId?: string;
}

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(MaterialType)
  @IsOptional()
  type?: MaterialType;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  stockQty?: number;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  inventoryAccountId?: string;

  @IsString()
  @IsOptional()
  salesAccountId?: string;
}
