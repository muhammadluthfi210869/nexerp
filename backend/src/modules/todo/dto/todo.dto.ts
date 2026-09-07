import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsIn,
} from 'class-validator';

export const ALLOWED_TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
] as const;

export class CreateBoardDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(ALLOWED_TASK_STATUSES)
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}

export class UpdateTaskStatusDto {
  @IsIn(ALLOWED_TASK_STATUSES)
  status!: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(ALLOWED_TASK_STATUSES)
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
