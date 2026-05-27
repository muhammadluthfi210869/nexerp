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
import { RequisitionHeaderStatus } from '@prisma/client';

export class RequisitionItemDto {
  @IsUUID()
  materialId!: string;

  @Type(() => Number)
  @IsNumber()
  qty!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRequisitionDto {
  @IsUUID()
  fromWarehouse!: string;

  @IsUUID()
  toWarehouse!: string;

  @IsOptional()
  @IsDateString()
  requestDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items!: RequisitionItemDto[];
}

export class UpdateRequisitionStatusDto {
  @IsEnum(RequisitionHeaderStatus)
  status!: RequisitionHeaderStatus;
}
