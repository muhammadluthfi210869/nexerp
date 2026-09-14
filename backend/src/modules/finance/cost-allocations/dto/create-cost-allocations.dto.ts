import { ApiProperty } from '@nestjs/swagger';

export class CreateCostAllocationsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-09-08' })
  allocationDate: string;

  @ApiProperty({ example: 5000000 })
  amount: number;

  @ApiProperty({ example: 'HEAD OFFICE' })
  fromCostCenter: string;

  @ApiProperty({ example: 'PRODUCTION' })
  toCostCenter: string;

  @ApiProperty({ example: 'DIRECT' })
  allocationMethod: string;
}
