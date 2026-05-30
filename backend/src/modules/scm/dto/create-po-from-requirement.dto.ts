import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePOFromRequirementDto {
  @IsUUID()
  materialId!: string;

  @IsUUID()
  supplierId!: string;

  @Type(() => Number)
  @IsNumber()
  qty!: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBulkPOFromRequirementDto {
  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsOptional()
  items?: CreatePOFromRequirementDto[];
}
