import {
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Division } from '@prisma/client';

export class CreateFundRequestDto {
  @IsEnum(Division)
  departmentId!: Division;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
