import { ApiProperty } from '@nestjs/swagger';

export class CreateDownPaymentsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "DPB-2609-0001" })
  dpNumber: string;

  @ApiProperty({ example: "uuid" })
  vendorId: string;

  @ApiProperty({ example: 500000 })
  amount: number;

  @ApiProperty({ example: "2026-09-08" })
  dpDate: string;

  @ApiProperty({ example: "PENDING" })
  status: string;
}
