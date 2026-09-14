import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class LockPeriodDto {
  @ApiProperty({ example: '2026-09-01', description: 'First day of month to lock' })
  @IsDateString()
  period: string;

  @ApiProperty({ example: 'September 2026 monthly close', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UnlockPeriodDto {
  @ApiProperty({ example: 'Audit correction needed for September close' })
  @IsString()
  @MinLength(5)
  reason: string;
}
