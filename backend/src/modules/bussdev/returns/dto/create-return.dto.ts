import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReturnItemDto {
  @IsUUID()
  materialId!: string;

  @IsOptional()
  qty?: number;

  @IsOptional()
  qtyOriginal?: number;

  @IsOptional()
  qtyReturned?: number;
}

export class CreateReturnDto {
  @IsUUID()
  soId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  returnStatus?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items?: CreateReturnItemDto[];
}
