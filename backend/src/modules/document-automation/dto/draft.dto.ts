import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { DocumentDraftStatus } from '@prisma/client';

export class ApproveDraftDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectDraftDto {
  @IsString()
  reason: string = '';
}

export class UpdateDraftDto {
  @IsOptional()
  payload?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FilterDraftsDto {
  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;
}
