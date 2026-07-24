import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { TicketType } from '@prisma/client';

export class CreateTicketDto {
  @IsEnum(TicketType)
  type!: TicketType;

  @IsString()
  reason!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
