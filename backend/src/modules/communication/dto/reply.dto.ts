import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;

  @IsOptional()
  @IsUUID()
  parentReplyId?: string;

  // Inline mentions at reply time (server may also resolve from body parsing).
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  mentionIds?: string[];
}

export class AddMentionDto {
  @IsUUID()
  mentionedUserId!: string;
}
