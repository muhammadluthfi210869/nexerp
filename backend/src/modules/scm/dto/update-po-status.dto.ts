import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { POStatus } from '@prisma/client';

export class UpdatePoStatusDto {
  @IsEnum(POStatus)
  @IsNotEmpty()
  status!: POStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
