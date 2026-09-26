/**
 * wa-self-qr.controller.ts — NEX ERP Batch 1.
 *
 * ALL routes JWT-guarded. NO outbound mutation endpoints exist (architecturally).
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { CollectorService } from './collector.service';
import { CoverageService } from './coverage.service';
import { SalesDeviceManager } from './sales-device-manager';

@Controller('wa-self-qr')
@UseGuards(JwtAuthGuard)
export class WaSelfQrController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collector: CollectorService,
    private readonly coverage: CoverageService,
    private readonly sales: SalesDeviceManager,
  ) {}

  @Get('devices')
  async listDevices() {
    const rows = await this.prisma.selfQrDevice.findMany({
      select: {
        id: true,
        internalCode: true,
        displayName: true,
        normalizedPhone: true,
        phoneLast4: true,
        status: true,
        enabled: true,
        pairedAt: true,
        lastReadyAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return { devices: rows };
  }

  @Get('devices/:id/status')
  async getStatus(@Param('id') id: string) {
    const status = await this.collector.getStatus();
    if (!status || status.deviceId !== id) {
      const row = await this.prisma.selfQrDevice.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!row) throw new NotFoundException('device not found');
      return { deviceId: row.id, status: row.status };
    }
    return {
      deviceId: status.deviceId,
      internalCode: status.internalCode,
      displayName: status.displayName,
      phoneLast4: status.phoneLast4,
      status: status.status,
      pairedAt: status.pairedAt,
      lastReadyAt: status.lastReadyAt,
      lastError: status.lastError,
    };
  }

  @Get('devices/:id/qr')
  async getQr(@Param('id') id: string) {
    const status = await this.collector.getStatus();
    if (!status || status.deviceId !== id) throw new NotFoundException('device not bootstrapped yet');
    const qr = this.collector.getCurrentQr();
    const qrPngPath = this.collector.getCurrentQrPngPath();
    if (!qr) return { deviceId: id, qr: null, qrPngPath: null };
    return {
      deviceId: id,
      qr: qr.qr,
      expiresInSeconds: qr.expiresInSeconds,
      generatedAt: qr.generatedAt,
      qrPngPath,
    };
  }

  @Post('devices/:id/pairing-code')
  async requestPairingCode(
    @Param('id') _id: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Body() _body: { phone?: string }, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    // whatsapp-web.js has no pairing-code API. QR is the only pairing flow.
    // Keep the route so any caller still referencing the old Baileys
    // endpoint gets a deterministic 410 Gone response.
    throw new HttpException(
      {
        statusCode: HttpStatus.GONE,
        message: 'pairing-code API removed — transport is whatsapp-web.js; use QR flow via GET /devices/:id/qr',
        reason: 'baileys_pairing_code_no_longer_used',
      },
      HttpStatus.GONE,
    );
  }

  @Post('devices/:id/history-sync')
  async triggerHistory(@Param('id') id: string) {
    const status = await this.collector.getStatus();
    if (!status || status.deviceId !== id) throw new NotFoundException('device not ready');
    const from = new Date('2026-08-01T00:00:00+07:00');
    const to = new Date();
    const runId = await this.collector.triggerHistorySync({ requestedFrom: from, requestedTo: to });
    return { deviceId: id, runId, requestedFrom: from.toISOString(), requestedTo: to.toISOString() };
  }

  @Get('devices/:id/coverage')
  async getCoverage(@Param('id') id: string) {
    const status = await this.collector.getStatus();
    if (!status || status.deviceId !== id) throw new NotFoundException('device not ready');
    const report = await this.coverage.reportForPilot();
    if (!report) throw new NotFoundException('no coverage report available yet');
    return report;
  }

  @Get('devices/:id/events')
  async listEvents(@Param('id') id: string) {
    const rows = await this.prisma.selfQrNormalizedEvent.findMany({
      where: { deviceId: id },
      orderBy: { whatsappTimestamp: 'desc' },
      take: 50,
      select: {
        id: true,
        externalMessageId: true,
        whatsappTimestamp: true,
        direction: true,
        fromMe: true,
        customerPhone: true,
        customerLid: true,
        identityStatus: true,
        messageType: true,
        textBody: true,
        source: true,
      },
    });
    return { deviceId: id, count: rows.length, events: rows };
  }

  // --- Batch 3: connect-token generation for Sales pairing (admin only) ---

  @Get('sales-devices')
  async listSalesDevices() {
    return { devices: this.sales.listDevices() };
  }

  @Post('sales-devices/:internalCode/connect-token')
  async createConnectToken(@Param('internalCode') internalCode: string) {
    const all = this.sales.listDevices();
    const dev = all.find((d) => d.internalCode === internalCode);
    if (!dev) throw new NotFoundException(`unknown sales device: ${internalCode}`);
    // Lazily start the transport so a fresh QR is generated.
    await this.sales.startDeviceTransport(internalCode);
    const tok = this.sales.generateConnectToken(internalCode);
    return {
      internalCode,
      displayName: dev.displayName,
      token: tok.token,
      url: tok.url,
      expiresAt: tok.expiresAt.toISOString(),
    };
  }
}
