// qr.controller.ts — Endpoints for QR sales generation + public resolve.
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { QrService } from './qr.service';
import { GenerateQrDto, QrCodeResponseDto } from './qr.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('lead-capture/qr')
export class QrController {
  constructor(private qr: QrService) {}

  /**
   * Sales creates a new QR for a channel/campaign.
   * Auth: any logged user can generate their own QR.
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Body() dto: GenerateQrDto): Promise<QrCodeResponseDto> {
    return this.qr.generate(dto);
  }

  /**
   * Sales dashboard: list QR codes (optionally filtered by sales person).
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query('salesUserId') salesUserId?: string) {
    return this.qr.listForSales(salesUserId);
  }

  /**
   * PUBLIC endpoint hit when customer scans QR. No auth.
   * Resolves token, increments scan counter, redirects to thank-you page.
   * Path: /lead-capture/qr/resolve/:token  (proxied by nginx as /q/:token)
   */
  @Get('resolve/:token')
  @Redirect()
  async resolve(@Param('token') token: string) {
    const result = await this.qr.resolveAndTrack(token);
    return { url: result.redirectUrl, statusCode: 302 };
  }

  /**
   * Internal hook: LeadCapture service notifies QR after attribution.
   * Not exposed via API gateway (called server-side only).
   */
  @Post('attributed/:trackingCode')
  async attributed(@Param('trackingCode') trackingCode: string) {
    await this.qr.incrementLeadCount(trackingCode);
    return { ok: true };
  }
}