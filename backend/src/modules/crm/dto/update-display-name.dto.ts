import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateDisplayNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class ApproveGuestbookDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  approverNote?: string;
}
