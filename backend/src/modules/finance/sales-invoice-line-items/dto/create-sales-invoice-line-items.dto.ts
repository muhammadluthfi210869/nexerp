import { ApiProperty } from '@nestjs/swagger';

export class CreateSalesInvoiceLineItemsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  invoiceId: string;

  @ApiProperty({ example: "PROD001" })
  itemCode: string;

  @ApiProperty({ example: "Product X" })
  itemName: string;

  @ApiProperty({ example: 10 })
  qty: number;

  @ApiProperty({ example: "PCS" })
  unit: string;

  @ApiProperty({ example: 100000 })
  price: number;

  @ApiProperty({ example: 1000000 })
  total: number;
}
