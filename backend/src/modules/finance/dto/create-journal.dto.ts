import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalLineDto {
  @ApiProperty({ example: 'uuid-acc-123', description: 'COA Account ID' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 1000000, description: 'Debit amount' })
  @IsNumber()
  @Min(0)
  debit!: number;

  @ApiProperty({ example: 0, description: 'Credit amount' })
  @IsNumber()
  @Min(0)
  credit!: number;

  @ApiPropertyOptional({ example: 0.1, description: 'Tax rate (0.1 = 10%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ example: 'uuid-tax-456' })
  @IsOptional()
  @IsString()
  taxAccountId?: string;
}

export class CreateJournalDto {
  @ApiProperty({ example: '2024-05-01' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'REF-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Manual Journal Entry' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string' } })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ example: 'PURCHASE_ORDER' })
  @IsOptional()
  @IsString()
  sourceDocumentType?: string;

  @ApiPropertyOptional({ example: 'uuid-doc-789' })
  @IsOptional()
  @IsString()
  sourceDocumentId?: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
