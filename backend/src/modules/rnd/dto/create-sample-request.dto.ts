import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSampleDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  leadId!: string;

  @ApiProperty({ example: 'Luminous Serum' })
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @ApiProperty({ example: 'Brightening' })
  @IsString()
  @IsNotEmpty()
  targetFunction!: string;

  @ApiProperty({ example: 'Liquid Gel' })
  @IsString()
  @IsNotEmpty()
  textureReq!: string;

  @ApiProperty({ example: 'Clear' })
  @IsString()
  @IsNotEmpty()
  colorReq!: string;

  @ApiProperty({ example: 'Floral' })
  @IsString()
  @IsNotEmpty()
  aromaReq!: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  targetHpp?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  targetDeadline?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  difficultyLevel?: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  picId?: string;
}
