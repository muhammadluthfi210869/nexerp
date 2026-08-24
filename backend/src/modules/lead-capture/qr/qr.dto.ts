// qr.dto.ts — DTOs for QR sales generator
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsObject,
} from 'class-validator';

export enum QrChannel {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  OFFLINE = 'OFFLINE',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER',
}

export class GenerateQrDto {
  @IsEnum(QrChannel)
  channel!: QrChannel;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  campaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignedSalesId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class QrCodeResponseDto {
  id!: string;
  token!: string;
  trackingCode!: string;
  url!: string;
  qrPngBase64!: string;
  channel!: QrChannel;
  campaign?: string;
  assignedSalesId?: string;
  scanCount!: number;
  leadCount!: number;
  createdAt!: string;
  expiresAt?: string;
}