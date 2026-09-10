import { ApiProperty } from '@nestjs/swagger';

export class CreateClientEscrowsDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  customerId: string;

  @ApiProperty({ example: 10000000 })
  amount: number;

  @ApiProperty({ example: '2026-09-01' })
  depositDate: string;

  @ApiProperty({ example: '2026-12-31' })
  releaseDate: string;

  @ApiProperty({ example: 'HELD' })
  status: string;
}
