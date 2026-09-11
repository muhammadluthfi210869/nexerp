import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCostVarianceDto {
  @ApiProperty({ example: 'uuid', description: 'Job Order ID' })
  @IsUUID()
  jobOrderId: string;

  @ApiProperty({ example: 'MATERIAL', enum: ['MATERIAL', 'LABOR', 'OVERHEAD'] })
  @IsIn(['MATERIAL', 'LABOR', 'OVERHEAD'])
  varianceType: 'MATERIAL' | 'LABOR' | 'OVERHEAD';

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  @Min(0)
  standardCost: number;

  @ApiProperty({ example: 1150000 })
  @IsNumber()
  @Min(0)
  actualCost: number;

  @ApiProperty({ example: 'Material price increased 15%', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
