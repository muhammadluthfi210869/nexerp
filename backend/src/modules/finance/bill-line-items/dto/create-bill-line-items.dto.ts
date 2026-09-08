import { ApiProperty } from '@nestjs/swagger';

export class CreateBillLineItemsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  billId: string;

  @ApiProperty({ example: "BBK00028" })
  itemCode: string;

  @ApiProperty({ example: "Raw Material X" })
  itemName: string;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiProperty({ example: "PCS" })
  unit: string;

  @ApiProperty({ example: 10000 })
  price: number;

  @ApiProperty({ example: 1000000 })
  total: number;
}
