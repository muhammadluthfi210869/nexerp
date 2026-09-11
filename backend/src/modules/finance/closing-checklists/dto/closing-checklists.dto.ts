import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class GenerateChecklistDto {
  @ApiProperty({ example: '2026-09-01', description: 'Period start date (YYYY-MM-DD)' })
  @IsDateString()
  period: string;
}

export class CompleteItemDto {
  @ApiProperty({ example: 'Reconciliation confirmed against bank statement', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
