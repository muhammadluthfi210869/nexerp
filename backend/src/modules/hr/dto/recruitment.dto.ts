import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export const RECRUITMENT_STAGES = [
  'APPLIED',
  'INTERVIEW',
  'TEST',
  'OFFERING',
  'HIRED',
  'REJECTED',
] as const;

export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];

export class CreateRecruitmentDto {
  @IsString()
  name!: string;

  @IsString()
  position!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  matchScore?: number;

  @IsOptional()
  @IsIn(RECRUITMENT_STAGES as readonly string[])
  stage?: RecruitmentStage;
}

export class UpdateRecruitmentStageDto {
  @IsIn(RECRUITMENT_STAGES as readonly string[])
  stage!: RecruitmentStage;

  @IsOptional()
  @IsString()
  notes?: string;
}