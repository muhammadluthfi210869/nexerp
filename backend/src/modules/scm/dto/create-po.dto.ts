import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'PO-2024-001', description: 'Human-readable PO ID' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'uuid-supplier-123' })
  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;

  @ApiPropertyOptional({ example: 'uuid-lead-456' })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  items?: any[];

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  estArrival?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  escalationPin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  escalationReason?: string;
}
