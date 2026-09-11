import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { LogActivityType } from '@prisma/client';

export class LogActivityDto {
  @IsEnum(LogActivityType)
  type!: LogActivityType;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}