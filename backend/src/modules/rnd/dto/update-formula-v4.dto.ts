import {
  IsNumber,
  IsNotEmpty,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFormulaItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsNotEmpty()
  dosagePercentage!: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  costSnapshot?: number;
}

export class UpdateFormulaPhaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  prefix!: string;

  @ApiPropertyOptional({ example: 'Water Phase' })
  @IsOptional()
  @IsString()
  customName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  order!: number;

  @ApiProperty({ type: [UpdateFormulaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFormulaItemDto)
  items!: UpdateFormulaItemDto[];
}

export class UpdateQCParameterDto {
  @ApiPropertyOptional({ example: '5.5' })
  @IsOptional()
  @IsString()
  targetPh?: string;

  @ApiPropertyOptional({ example: '4000 cps' })
  @IsOptional()
  @IsString()
  targetViscosity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetAroma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appearance?: string;
}

export class UpdateFormulaV4Dto {
  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsNotEmpty()
  targetYieldGram!: number;

  @ApiProperty({ type: [UpdateFormulaPhaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFormulaPhaseDto)
  phases!: UpdateFormulaPhaseDto[];

  @ApiPropertyOptional({ type: UpdateQCParameterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateQCParameterDto)
  qcParameters?: UpdateQCParameterDto;
}
