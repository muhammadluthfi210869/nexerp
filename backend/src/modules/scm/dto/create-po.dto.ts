import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'uuid-supplier-123' })
  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;

  @ApiPropertyOptional({ example: 'uuid-warehouse-456' })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  taxPercent?: number;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  estArrival?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  prId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  discountManual?: number;

  @ApiPropertyOptional()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  discountRounding?: number;

  @ApiPropertyOptional()
  @IsOptional()
  shippingCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priceOverrideReason?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  escalationPin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  escalationReason?: string;
}
