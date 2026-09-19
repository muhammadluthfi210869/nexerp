import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class WarehouseAccessDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsBoolean()
  canRead?: boolean = true;

  @IsOptional()
  @IsBoolean()
  canWrite?: boolean = false;

  @IsOptional()
  @IsBoolean()
  canApprove?: boolean = false;
}
