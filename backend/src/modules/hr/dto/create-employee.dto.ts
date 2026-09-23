import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType, Division } from '@prisma/client';

export class EmployeeRoleDto {
  @IsEnum(Division)
  division!: Division;

  @IsString()
  roleName!: string;

  @IsNumber()
  weight!: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  npwp?: string;

  @IsOptional()
  @IsString()
  bpjsKesehatan?: string;

  @IsOptional()
  @IsString()
  bpjsKetenagakerjaan?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankHolder?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  baseSalary?: string;

  @IsOptional()
  @IsString()
  positionAllowance?: string;

  @IsOptional()
  @IsString()
  transportFlat?: string;

  @IsOptional()
  @IsString()
  transportTentativeDaily?: string;

  @IsOptional()
  @IsString()
  onboardingStatus?: string;

  @IsOptional()
  @IsNumber()
  totalTrainingHours?: number;

  @IsDateString()
  joinedAt!: string;

  @IsOptional()
  @IsDateString()
  contractEnd?: string;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeRoleDto)
  roles?: EmployeeRoleDto[];
}
