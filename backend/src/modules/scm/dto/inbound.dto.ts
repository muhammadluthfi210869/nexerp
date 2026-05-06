import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundStatus } from '@prisma/client';

export class InboundItemDto {
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsNumber()
  @IsNotEmpty()
  qtyActual!: number;
}

export class CreateInboundDto {
  @IsString()
  @IsNotEmpty()
  poId!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboundItemDto)
  items!: InboundItemDto[];
}

export class UpdateInboundStatusDto {
  @IsEnum(InboundStatus)
  @IsNotEmpty()
  status!: InboundStatus;
}
