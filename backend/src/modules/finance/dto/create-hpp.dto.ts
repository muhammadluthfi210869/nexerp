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
import { HppStatus } from '@prisma/client';

export class HppMoqPointDto {
  @Type(() => Number)
  @IsNumber()
  moq!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hppResult?: number;
}

export class CreateHppRequestDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  sampleId?: string;

  @IsOptional()
  @IsUUID()
  formulaId?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsUUID()
  primaryPackId?: string;

  @IsOptional()
  @IsUUID()
  secondaryPackId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HppMoqPointDto)
  moqPoints!: HppMoqPointDto[];
}

export class UpdateHppStatusDto {
  @IsEnum(HppStatus)
  status!: HppStatus;
}
