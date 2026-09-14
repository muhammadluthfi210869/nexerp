import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { TicketType } from '@prisma/client';

export class CreateTicketDto {
  @IsUUID()
  employeeId!: string;

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

  @IsOptional()
  @IsString()
  attachmentPath?: string;
}
