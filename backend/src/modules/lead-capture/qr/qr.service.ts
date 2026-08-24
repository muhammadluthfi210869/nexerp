// qr.service.ts — Generate QR codes for sales attribution.
// Each QR carries a unique token + tracking code. Scanning creates a
// LeadCapture via the existing /track pipeline (auto-incremented).
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { QrChannel, GenerateQrDto, QrCodeResponseDto } from './qr.dto';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

const TOKEN_BYTES = 6; // 12 hex chars
const TRACKING_PREFIX = 'QR';
const DEFAULT_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://nexerp.id';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a QR for a sales channel. Persists QrCode row + returns PNG.
   */
  async generate(dto: GenerateQrDto): Promise<QrCodeResponseDto> {
    if (!Object.values(QrChannel).includes(dto.channel)) {
      throw new BadRequestException(`Invalid channel: ${dto.channel}`);
    }

    const token = randomBytes(TOKEN_BYTES).toString('hex').toUpperCase();
    const trackingCode = `${TRACKING_PREFIX}-${token}`;

    // Resolve sales user if provided
    let assignedSalesId: string | null = null;
    if (dto.assignedSalesId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedSalesId },
        select: { id: true },
      });
      if (!user) {
        throw new BadRequestException(`User not found: ${dto.assignedSalesId}`);
      }
      assignedSalesId = user.id;
    }

    const row = await this.prisma.qrCode.create({
      data: {
        token,
        trackingCode,
        channel: dto.channel,
        campaign: dto.campaign ?? null,
        assignedSalesId,
        metadata: dto.metadata
          ? (dto.metadata as object as any)
          : undefined,
      },
    });

    const url = `${DEFAULT_BASE_URL}/q/${token}`;
    const qrPngBase64 = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    });

    this.logger.log(
      `QR generated: token=${token} channel=${dto.channel} campaign=${dto.campaign ?? '-'}`,
    );

    return this.toDto(row, url, qrPngBase64);
  }

  /**
   * Resolve a QR token to its tracking code (for /q/:token public route).
   * Increments scanCount. Returns 404 if QR is inactive.
   */
  async resolveAndTrack(token: string): Promise<{
    trackingCode: string;
    qrId: string;
    channel: string;
    campaign: string | null;
    redirectUrl: string;
  }> {
    const upper = token.toUpperCase();
    const row = await this.prisma.qrCode.findUnique({
      where: { token: upper },
    });
    if (!row) throw new NotFoundException(`QR not found: ${token}`);
    if (!row.isActive) throw new NotFoundException(`QR inactive: ${token}`);

    // Auto-expire if expiresAt passed
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException(`QR expired: ${token}`);
    }

    // Increment scan counter (atomic)
    await this.prisma.qrCode.update({
      where: { id: row.id },
      data: { scanCount: { increment: 1 } },
    });

    const redirectUrl = `${DEFAULT_BASE_URL}/thank-you?code=${row.trackingCode}&via=qr&token=${upper}`;

    return {
      trackingCode: row.trackingCode,
      qrId: row.id,
      channel: row.channel,
      campaign: row.campaign,
      redirectUrl,
    };
  }

  /**
   * Called by LeadCapture service after a Lead is attributed to a QR
   * tracking code (via /track with `via=qr`). Idempotent.
   */
  async incrementLeadCount(trackingCode: string): Promise<void> {
    await this.prisma.qrCode.updateMany({
      where: { trackingCode },
      data: { leadCount: { increment: 1 } },
    });
  }

  /**
   * Sales dashboard read: list QRs with recent activity.
   */
  async listForSales(salesUserId?: string, limit = 50) {
    const where = salesUserId ? { assignedSalesId: salesUserId } : {};
    return this.prisma.qrCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private toDto(row: any, url: string, qrPngBase64: string): QrCodeResponseDto {
    return {
      id: row.id,
      token: row.token,
      trackingCode: row.trackingCode,
      url,
      qrPngBase64,
      channel: row.channel,
      campaign: row.campaign ?? undefined,
      assignedSalesId: row.assignedSalesId ?? undefined,
      scanCount: row.scanCount ?? 0,
      leadCount: row.leadCount ?? 0,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
    };
  }
}