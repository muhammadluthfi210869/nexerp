import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Contact person / PIC' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: 'PIC alias' })
  @IsOptional()
  @IsString()
  pic?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Province' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'District / Kecamatan' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Address detail' })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({ description: 'Term of payment in days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  termOfPayment?: number;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Contact person / PIC' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: 'PIC alias' })
  @IsOptional()
  @IsString()
  pic?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Province' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'District' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Address detail' })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({ description: 'Term of payment in days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  termOfPayment?: number;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Blacklist status' })
  @IsOptional()
  @IsBoolean()
  isBlacklisted?: boolean;
}

export class QuerySupplierDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Bahan type filter' })
  @IsOptional()
  @IsString()
  bahanType?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page limit (max 200)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}
