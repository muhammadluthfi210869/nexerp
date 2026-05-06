import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormulaItemDto {
  @ApiProperty({ example: 'uuid-mat-123' })
  @IsUUID()
  @IsNotEmpty()
  materialId!: string;

  @ApiProperty({ example: 45.5, description: 'Percentage dosage (0-100)' })
  @IsNumber()
  @IsNotEmpty()
  dosagePercentage!: number;

  @ApiProperty({
    example: 5000,
    description: 'Cost per unit at the time of creation',
  })
  @IsNumber()
  @IsNotEmpty()
  costSnapshot!: number;
}

export class CreateFormulaDto {
  @ApiProperty({ example: 'uuid-sample-123' })
  @IsUUID()
  @IsNotEmpty()
  sampleRequestId!: string;

  @ApiProperty({ example: 100, description: 'Total weight in grams' })
  @IsNumber()
  @IsNotEmpty()
  totalWeightGr!: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isFinal?: boolean;

  @ApiProperty({ type: [CreateFormulaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormulaItemDto)
  items!: CreateFormulaItemDto[];
}
