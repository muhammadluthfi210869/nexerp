import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { POStatus } from '@prisma/client';

export class UpdatePoStatusDto {
  @ApiProperty({ enum: POStatus, example: POStatus.PENDING_APPROVAL })
  @IsEnum(POStatus, {
    message: `status harus berupa salah satu dari: ${Object.values(POStatus).join(', ')}`,
  })
  @IsNotEmpty()
  status!: POStatus;

  @ApiPropertyOptional({ example: 'Alasan perubahan status' })
  @IsOptional()
  @IsString()
  reason?: string;
}
