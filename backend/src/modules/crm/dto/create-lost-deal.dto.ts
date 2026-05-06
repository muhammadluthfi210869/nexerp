import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { LostStage, LostReason } from '@prisma/client';

export class CreateLostDealDto {
  @IsUUID()
  @IsNotEmpty()
  leadId!: string;

  @IsEnum(LostStage)
  @IsNotEmpty()
  stageLost!: LostStage;

  @IsEnum(LostReason)
  @IsNotEmpty()
  reasonType!: LostReason;

  @IsString()
  @IsOptional()
  notes?: string;
}
