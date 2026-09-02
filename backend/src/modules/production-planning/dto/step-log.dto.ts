import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ProdStage } from '@prisma/client';

export class CreateStepLogDto {
  @IsUUID()
  @IsNotEmpty()
  woId!: string;

  @IsEnum(ProdStage)
  @IsNotEmpty()
  stage!: ProdStage;

  @IsNumber()
  @IsNotEmpty()
  inputQty!: number;

  @IsNumber()
  @IsNotEmpty()
  qtyResult!: number;

  @IsNumber()
  @IsNotEmpty()
  qtyReject!: number;

  @IsNumber()
  @IsNotEmpty()
  qtyQuarantine!: number;

  @IsNumber()
  @IsOptional()
  shrinkageQty?: number;
}
