import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsIn, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateAssetDisposalDto {
  @ApiProperty({ example: 'uuid', description: 'Asset to dispose' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ example: '2026-09-20' })
  @IsDateString()
  disposalDate: string;

  @ApiProperty({ example: 'SALE', enum: ['SALE', 'WRITE_OFF', 'SCRAP'] })
  @IsIn(['SALE', 'WRITE_OFF', 'SCRAP'])
  disposalType: 'SALE' | 'WRITE_OFF' | 'SCRAP';

  @ApiProperty({ example: 80000000, description: 'Proceeds from sale (0 for write-off/scrap)' })
  @IsNumber()
  @Min(0)
  proceeds: number;

  @ApiProperty({ example: 'PT Xyz', required: false, description: 'Buyer name (for SALE)' })
  @IsOptional()
  @IsString()
  buyer?: string;

  @ApiProperty({ example: 'Replacement cycle', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
