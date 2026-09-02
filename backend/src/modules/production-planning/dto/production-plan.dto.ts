import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LifecycleStatus } from '@prisma/client';

export class CreateProductionPlanDto {
  @IsString()
  @IsNotEmpty()
  soId!: string;

  @IsString()
  @IsNotEmpty()
  batchNo!: string;

  @IsEnum(LifecycleStatus)
  @IsOptional()
  status?: LifecycleStatus;
}

export class UpdatePlanStatusDto {
  @IsEnum(LifecycleStatus)
  @IsNotEmpty()
  status!: LifecycleStatus;
}
