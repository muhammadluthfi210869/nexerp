import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ErrorReportItemDto {
  @IsString()
  id!: string;

  @IsString()
  level!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsString()
  digest?: string;

  @IsOptional()
  @IsString()
  componentName?: string;

  @IsString()
  route!: string;

  @IsString()
  timestamp!: string;

  @IsString()
  userAgent!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ErrorReportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorReportItemDto)
  errors!: ErrorReportItemDto[];
}
