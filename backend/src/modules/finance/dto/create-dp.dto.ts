import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreatePurchaseDpDto {
  @IsUUID()
  poId!: string;

  @IsDateString()
  date!: string;

  @IsUUID()
  coaId!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSalesDpDto {
  @IsUUID()
  soId!: string;

  @IsDateString()
  date!: string;

  @IsUUID()
  coaId!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
