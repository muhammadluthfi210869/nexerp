import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateFundRequestDto {
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsArray()
  @IsOptional()
  attachmentUrls?: string[];
}

export class ApproveFundRequestDto {
  @IsUUID()
  @IsOptional()
  approvedById?: string;
}

export class DisburseFundRequestDto {
  @IsUUID()
  @IsOptional()
  disbursedById?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string; // Optional: Finance may use the configured cash account.
}

export class DirectorApproveFundRequestDto {
  @IsUUID()
  @IsNotEmpty()
  approvedById!: string;
}

export class RejectFundRequestDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
