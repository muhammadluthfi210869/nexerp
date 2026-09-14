import { ApiProperty } from '@nestjs/swagger';

export class CreateCostVariancesDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  jobOrderId: string;

  @ApiProperty({ example: 'MATERIAL' })
  varianceType: string;

  @ApiProperty({ example: 1000000 })
  standardCost: number;

  @ApiProperty({ example: 1100000 })
  actualCost: number;

  @ApiProperty({ example: 100000 })
  variance: number;
}
