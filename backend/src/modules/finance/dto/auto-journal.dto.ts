import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAutoJournalConfigDto {
  @IsString()
  transactionType!: string;

  @IsUUID()
  coaDebetId!: string;

  @IsUUID()
  coaCreditId!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAutoJournalConfigDto {
  @IsUUID()
  coaDebetId!: string;

  @IsUUID()
  coaCreditId!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
