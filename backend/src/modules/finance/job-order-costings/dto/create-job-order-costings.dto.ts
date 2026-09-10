import { ApiProperty } from '@nestjs/swagger';

export class CreateJobOrderCostingsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'JO-2609-0001' })
  jobOrderNumber: string;

  @ApiProperty({ example: 'Custom order #1', required: false })
  description?: string;

  @ApiProperty({ example: 10000000 })
  totalCost: number;

  @ApiProperty({ example: 15000000 })
  totalRevenue: number;

  @ApiProperty({ example: '2026-09-30' })
  closedAt: string;
}
