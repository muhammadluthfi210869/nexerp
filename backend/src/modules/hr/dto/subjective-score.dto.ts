import {
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsString,
  IsOptional,
} from 'class-validator';

export class SubjectiveScoreDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  period!: string; // YYYY-MM format

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
