import {
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'json'], default: 'json' })
  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json' = 'json';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ImportDataDto {
  @ApiPropertyOptional({ description: 'Rows array to import' })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(2000)
  rows?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Raw CSV text content' })
  @IsOptional()
  @IsString()
  @Length(1, 1000000)
  csvContent?: string;

  @ApiPropertyOptional({ description: 'Whether to dry-run without committing' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  @ApiPropertyOptional({ description: 'Unique idempotency key for durable execution' })
  @IsOptional()
  @IsString()
  @Length(8, 128)
  idempotencyKey?: string;
}
