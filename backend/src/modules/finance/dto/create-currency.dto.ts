import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

export class UpdateExchangeRateDto {
  @IsNumber()
  exchangeRate!: number;
}
