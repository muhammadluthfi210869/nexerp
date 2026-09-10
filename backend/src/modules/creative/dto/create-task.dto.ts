import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class CreateTaskDto {
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsString()
  brief?: string;

  @IsOptional()
  @IsUUID()
  soId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PACKAGING', 'PRINTING', 'LABEL', 'OTHER'])
  taskType?: string;
}
