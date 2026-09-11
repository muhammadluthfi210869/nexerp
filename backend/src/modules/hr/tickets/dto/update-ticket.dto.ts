import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsUUID()
  authorizedById?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
