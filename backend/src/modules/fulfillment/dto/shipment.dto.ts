import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ShipStatus } from '@prisma/client';

export class CreateShipmentDto {
  @IsNotEmpty()
  @IsString()
  soId!: string;

  @IsNotEmpty()
  @IsUUID()
  logisticsId!: string;

  @IsOptional()
  @IsString()
  trackingNo?: string;
}

export class UpdateShipmentStatusDto {
  @IsNotEmpty()
  @IsEnum(ShipStatus)
  status!: ShipStatus;
}
