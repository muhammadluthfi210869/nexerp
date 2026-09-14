import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateAuditDto {
  @IsString()
  area!: string;

  @IsDateString()
  auditDate!: string;

  @IsUUID()
  picId!: string;

  @IsOptional()
  @IsObject()
  parameterChecklist?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsDateString()
  remediationDeadline?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateAuditChecklistDto {
  @IsObject()
  parameterChecklist!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  checklistItems?: { item: string; checked: boolean; notes?: string }[];
}

export class AddFindingDto {
  @IsString()
  finding!: string;

  @IsOptional()
  @IsDateString()
  remediationDeadline?: string;
}
