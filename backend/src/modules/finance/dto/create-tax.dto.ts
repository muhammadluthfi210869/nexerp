import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateTaxDto {
  @IsString()
  name!: string;

  @IsNumber()
  rate!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
