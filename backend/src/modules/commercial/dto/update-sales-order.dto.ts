import { IsEnum, IsOptional } from 'class-validator';
import { SOStatus } from '@prisma/client';

export class UpdateSalesOrderDto {
  @IsEnum(SOStatus)
  @IsOptional()
  status?: SOStatus;
}
