import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendOutboundMessageDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsString()
  @Matches(/^\+?[0-9][0-9\s()-]{7,24}$/, {
    message: 'phone must be a valid international phone number',
  })
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message!: string;

  /** Public account alias. The actual Meta phone-number id stays server-side. */
  @IsOptional()
  @IsString()
  @Matches(/^BUSDEV_[1-9][0-9]?$/)
  accountKey?: string;

  /** Client-generated retry key. Duplicate requests reuse the first result. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientRequestId?: string;
}
