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
  @IsNotEmpty()
  approvedById!: string;
}

export class DisburseFundRequestDto {
  @IsUUID()
  @IsNotEmpty()
  disbursedById!: string;

  @IsUUID()
  @IsNotEmpty()
  accountId!: string; // The account from which money is taken (e.g., 1110)
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
