import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CategoryType {
  GOODS = 'GOODS',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER',
}

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['GOODS', 'SUPPLIER', 'CUSTOMER'] })
  @IsEnum(CategoryType)
  type!: CategoryType;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
