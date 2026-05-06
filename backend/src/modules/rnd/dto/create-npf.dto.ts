import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { NPFStatus } from '@prisma/client';

export class CreateNPFDto {
  @IsUUID()
  @IsNotEmpty()
  leadId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @IsNotEmpty()
  targetPrice!: number;

  @IsString()
  @IsOptional()
  conceptNotes?: string;

  @IsEnum(NPFStatus)
  @IsOptional()
  status?: NPFStatus;
}
