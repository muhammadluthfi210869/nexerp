import { ApiProperty } from '@nestjs/swagger';

export class CreateSalesInvoicesDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'INV-202609-0001' })
  invoiceNumber: string;

  @ApiProperty({ example: 'uuid' })
  customerId: string;

  @ApiProperty({ example: '2026-09-08' })
  invoiceDate: string;

  @ApiProperty({ example: '2026-10-08' })
  dueDate: string;

  @ApiProperty({ example: 1100000 })
  totalAmount: number;

  @ApiProperty({ example: 'PENDING' })
  paymentStatus: string;

  @ApiProperty({ example: 'PENDING' })
  deliveryStatus: string;
}
