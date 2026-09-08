import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryOwnershipsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  materialId: string;

  @ApiProperty({ example: "uuid" })
  warehouseId: string;

  @ApiProperty({ example: "COMPANY" })
  ownerType: string;

  @ApiProperty({ example: "uuid" })
  ownerId: string;

  @ApiProperty({ example: 1000 })
  quantity: number;

  @ApiProperty({ example: 5000 })
  unitCost: number;
}
