import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { GuestCategory } from '@prisma/client';

export class CreateGuestDto {
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @IsString()
  @IsOptional()
  productInterest?: string;

  @IsInt()
  @IsOptional()
  moqPlan?: number;

  @IsEnum(GuestCategory)
  category!: GuestCategory;

  @IsString()
  @IsOptional()
  phoneNo?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  launchingPlan?: string;

  @IsString()
  @IsOptional()
  targetMarket?: string;

  @IsString()
  @IsOptional()
  instansi?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsDateString()
  @IsOptional()
  visitDate?: string;
}
