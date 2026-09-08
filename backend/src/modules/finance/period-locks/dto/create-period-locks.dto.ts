import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodLocksDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "2026-09-01" })
  period: string;

  @ApiProperty({ example: false })
  isLocked: boolean;

  @ApiProperty({ example: "uuid" })
  lockedBy: string;

  @ApiProperty({ example: "2026-09-30" })
  lockedAt: string;
}
