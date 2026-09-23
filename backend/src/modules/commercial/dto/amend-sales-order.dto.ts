import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class AmendSalesOrderDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class SetDeliveryGateDto {
  @IsString()
  @IsIn(['HELD', 'RELEASED'])
  status!: 'HELD' | 'RELEASED';
}
