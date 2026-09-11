import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';

export class CreateInventoryOwnershipDto {
  @ApiProperty({ example: 'uuid', description: 'Material ID' })
  @IsUUID()
  materialId: string;

  @ApiProperty({ example: 'uuid', description: 'Warehouse ID' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({
    example: 'CONSIGNMENT',
    enum: ['COMPANY', 'CONSIGNMENT', 'CUSTOMER_OWNED', 'SUPPLIER_OWNED'],
  })
  @IsIn(['COMPANY', 'CONSIGNMENT', 'CUSTOMER_OWNED', 'SUPPLIER_OWNED'])
  ownerType: 'COMPANY' | 'CONSIGNMENT' | 'CUSTOMER_OWNED' | 'SUPPLIER_OWNED';

  @ApiProperty({ example: 'uuid', required: false, description: 'Customer/Supplier ID for non-COMPANY owners' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ example: 100, description: 'Quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 25000, required: false, description: 'Unit cost (IDR)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class AdjustInventoryOwnershipDto {
  @ApiProperty({ example: -5, description: 'Quantity delta (positive = add, negative = remove)' })
  @IsNumber()
  delta: number;

  @ApiProperty({ example: 'Damaged in warehouse', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TransferInventoryOwnershipDto {
  @ApiProperty({ example: 'COMPANY', enum: ['COMPANY', 'CONSIGNMENT', 'CUSTOMER_OWNED', 'SUPPLIER_OWNED'] })
  @IsIn(['COMPANY', 'CONSIGNMENT', 'CUSTOMER_OWNED', 'SUPPLIER_OWNED'])
  newOwnerType: 'COMPANY' | 'CONSIGNMENT' | 'CUSTOMER_OWNED' | 'SUPPLIER_OWNED';

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  newOwnerId?: string;
}
