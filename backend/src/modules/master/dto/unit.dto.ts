import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  code?: string;
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  symbol?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}