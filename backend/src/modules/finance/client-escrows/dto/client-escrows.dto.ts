import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsIn, Min } from 'class-validator';

export class DepositEscrowDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 5000000, description: 'Escrow amount in IDR' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2026-09-08', required: false })
  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @ApiProperty({ example: 'Advance payment for PO-2026-0099', required: false })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ example: 'From BCA transfer', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid', description: 'Destination bank account', required: false })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}

export class ReleaseEscrowDto {
  @ApiProperty({ example: 'RELEASE', enum: ['RELEASE', 'RETURN', 'FORFEIT'] })
  @IsIn(['RELEASE', 'RETURN', 'FORFEIT'])
  action: 'RELEASE' | 'RETURN' | 'FORFEIT';

  @ApiProperty({ example: 'Customer completed order, release as final payment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
