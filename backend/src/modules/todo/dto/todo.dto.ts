import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  labels?: string[];
}

export class UpdateTaskStatusDto {
  @IsString()
  status!: string;
}
