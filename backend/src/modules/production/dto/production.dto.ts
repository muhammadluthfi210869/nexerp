import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LifecycleStatus } from '@prisma/client';

export class SubmitLogDto {
  @IsEnum(LifecycleStatus)
  stage!: LifecycleStatus;

  @IsNumber()
  @Min(0)
  inputQty!: number;

  @IsNumber()
  @Min(0)
  goodQty!: number;

  @IsNumber()
  @Min(0)
  quarantineQty!: number;

  @IsNumber()
  @Min(0)
  rejectQty!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LifecycleStatus)
  nextStage?: LifecycleStatus;
}
