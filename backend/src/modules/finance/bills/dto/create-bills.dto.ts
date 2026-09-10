import { ApiProperty } from '@nestjs/swagger';

export class CreateBillsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'FP-202609-000001' })
  billNumber: string;

  @ApiProperty({ example: 'uuid' })
  vendorId: string;

  @ApiProperty({ example: '2026-09-08' })
  billDate: string;

  @ApiProperty({ example: '2026-10-08' })
  dueDate: string;

  @ApiProperty({ example: 1000000 })
  totalAmount: number;

  @ApiProperty({ example: 'DRAFT' })
  status: string;

  @ApiProperty({ example: 'PO-202609-001', required: false })
  poNumber?: string;
}
