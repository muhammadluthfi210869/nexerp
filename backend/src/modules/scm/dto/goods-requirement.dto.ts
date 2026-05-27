import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
// RequirementStatus enum not in Prisma schema
// // RequirementStatus not available in current Prisma client generation
// import { RequirementStatus } from '@prisma/client';
enum RequirementStatus { DRAFT, SUBMITTED, APPROVED, DONE }

export class GoodsRequirementItemDto {
  @IsUUID()
  materialId!: string;

  @Type(() => Number)
  @IsNumber()
  qty!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateGoodsRequirementDto {
  @IsUUID()
  salesOrderId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsRequirementItemDto)
  items!: GoodsRequirementItemDto[];
}

export class UpdateGoodsRequirementStatusDto {
  @IsString()
  status!: string;
}
