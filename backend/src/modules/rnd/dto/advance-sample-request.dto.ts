import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SampleStage } from '@prisma/client';

export class AdvanceSampleDto {
  @IsEnum(SampleStage)
  newStage!: SampleStage;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
