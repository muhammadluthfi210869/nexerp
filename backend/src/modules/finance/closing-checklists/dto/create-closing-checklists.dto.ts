import { ApiProperty } from '@nestjs/swagger';

export class CreateClosingChecklistsDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "2026-09-01" })
  period: string;

  @ApiProperty({ example: "Finance" })
  department: string;

  @ApiProperty({ example: "Verify all AR aging" })
  item: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: "uuid" })
  completedBy: string;
}
