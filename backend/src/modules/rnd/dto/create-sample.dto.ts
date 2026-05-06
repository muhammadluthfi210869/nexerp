import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { SampleStatus } from '@prisma/client';

export class CreateSampleDto {
  @IsUUID()
  @IsNotEmpty()
  npfId!: string;

  @IsNumber()
  @IsOptional()
  version?: number;

  @IsUUID()
  @IsNotEmpty()
  rndId!: string;

  @IsEnum(SampleStatus)
  @IsOptional()
  status?: SampleStatus;
}
