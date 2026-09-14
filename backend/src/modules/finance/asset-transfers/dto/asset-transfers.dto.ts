import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class CreateAssetTransferDto {
  @ApiProperty({ example: 'uuid', description: 'Asset being transferred' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  transferDate: string;

  @ApiProperty({ example: 'Kantor Jakarta' })
  @IsString()
  @MinLength(1)
  fromLocation: string;

  @ApiProperty({ example: 'Kantor Surabaya' })
  @IsString()
  @MinLength(1)
  toLocation: string;

  @ApiProperty({ example: 'Pak Andi', required: false })
  @IsOptional()
  @IsString()
  fromPerson?: string;

  @ApiProperty({ example: 'Bu Susi', required: false })
  @IsOptional()
  @IsString()
  toPerson?: string;

  @ApiProperty({ example: 'Relokasi kantor cabang', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
