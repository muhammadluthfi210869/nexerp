import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, Min, MinLength } from 'class-validator';

export class CreateAdjustmentJournalDto {
  @ApiProperty({ example: '2026-09-01', description: 'Period (YYYY-MM-DD)' })
  @IsDateString()
  period: string;

  @ApiProperty({ example: 'Accrual for September utilities' })
  @IsString()
  @MinLength(5)
  description: string;

  @ApiProperty({ example: 5000000, description: 'Total amount of adjustment' })
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiProperty({ example: ['https://storage/utility-bill.pdf'], required: false })
  @IsOptional()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
