/**
 * sales-device-manager.ts — NEX ERP Batch 3.
 *
 * Minimal multi-device manager for the 4 authoritative Sales WhatsApp devices.
 * Each device gets its own whatsapp-web.js transport + LocalAuth folder. Connect
 * tokens are short-lived (5 min), cryptographically random (32 bytes hex),
 * mapped to exactly one device, and become unusable once that device pairs.
 *
 * Public surface is READ-ONLY: no sendMessage / reply / forward / broadcast
 * surface is added. Inbound + history observation only.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { normalizeIdPhone, phoneLast4 } from './phone-normalizer';
import { WhatsappWebJsTransport } from './whatsapp-webjs-transport';

// Authoritative 4 Sales WhatsApp devices (Marketing).
// Source of truth: pre-deploy readiness directive (Nisa / Jessica / Diaz / Irma).
// internalCodes are stable identifiers (kept stable for auth folder + DB row
// continuity); displayName is the human label that changes here.
const SALES_DEVICES: ReadonlyArray<{
  internalCode: string;
  displayName: string;
  rawPhone: string;
}> = [
  { internalCode: 'SALES-NISA',    displayName: 'Nisa',    rawPhone: '6281952417051' },
  { internalCode: 'SALES-JESSICA', displayName: 'Jessica', rawPhone: '6287712232389' },
  { internalCode: 'SALES-DIAZ',    displayName: 'Diaz',    rawPhone: '6287776550657' },
  { internalCode: 'SALES-IRMA',    displayName: 'Irma',    rawPhone: '6285133188827' },
];

const CHROME_PATH =
  process.env.CHROME_EXECUTABLE_PATH ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/chromium-browser');

const CONNECT_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 min
const QR_REFRESH_MS = 90 * 1000;            // refresh slightly inside whatsapp-web.js QR TTL

export type ConnectState =
  | { kind: 'NOT_FOUND' }
  | { kind: 'EXPIRED'; internalCode: string; displayName: string }
  | { kind: 'USED'; internalCode: string; displayName: string }
  | { kind: 'CONNECTING'; internalCode: string; displayName: string }
  | { kind: 'CONNECTED'; internalCode: string; displayName: string; maskedPhone: string }
  | { kind: 'ERROR'; internalCode: string; displayName: string; message: string }
  | {
      kind: 'QR_ACTIVE';
      internalCode: string;
      displayName: string;
      qrPngPath: string;
      expiresInSeconds: number;
    };

interface DeviceState {
  deviceId: string | null;
  internalCode: string;
  displayName: string;
  normalizedPhone: string;
  transport: WhatsappWebJsTransport | null;
  status: string;
  lastError: string | null;
  pairedAt: Date | null;
  currentQr: { qr: string; qrPngPath: string; expiresAt: number } | null;
}

interface ConnectToken {
  deviceInternalCode: string;
  expiresAt: number;
  used: boolean;
}

@Injectable()
export class SalesDeviceManager implements OnModuleInit {
  private readonly logger = new Logger(SalesDeviceManager.name);
  private readonly devices: Map<string, DeviceState> = new Map();
  private readonly tokens: Map<string, ConnectToken> = new Map();
  private readonly authRoot: string;

  constructor(private readonly prisma: PrismaService) {
    this.authRoot = process.env.SELF_QR_AUTH_ROOT
      ? path.resolve(process.env.SELF_QR_AUTH_ROOT)
      : path.resolve(process.cwd(), 'storage', 'self-qr-auth');
    fs.mkdirSync(this.authRoot, { recursive: true });
  }

  async onModuleInit(): Promise<void> {
    const activeFilter = process.env.SELF_QR_ACTIVE_DEVICES
      ? process.env.SELF_QR_ACTIVE_DEVICES.split(',').map((s) => s.trim().toUpperCase())
      : ['SALES-JESSICA'];

    const targetDevices = SALES_DEVICES.filter((d) =>
      activeFilter.includes('ALL') || activeFilter.includes(d.internalCode.toUpperCase()),
    );

    for (const d of targetDevices) {
      try {
        await this.bootstrapDevice(d);
      } catch (err: any) {
        this.logger.warn(`🪪 sales bootstrap failed for ${d.internalCode}: ${err?.message ?? 'unknown'}`);
      }
    }
    this.logger.log(`🪪 sales-device-manager: ${targetDevices.length} devices bootstrapped (paired=0)`);
  }

  listDevices(): Array<{
    deviceId: string | null;
    internalCode: string;
    displayName: string;
    normalizedPhone: string;
    status: string;
    pairedAt: Date | null;
    lastError: string | null;
  }> {
    return Array.from(this.devices.values()).map((d) => ({
      deviceId: d.deviceId,
      internalCode: d.internalCode,
      displayName: d.displayName,
      normalizedPhone: d.normalizedPhone,
      status: d.status,
      pairedAt: d.pairedAt,
      lastError: d.lastError,
    }));
  }

  /// Admin-side: generate a connect token for one Sales device.
  /// Returns the opaque token + the URL Sales should open.
  generateConnectToken(internalCode: string): {
    token: string;
    url: string;
    expiresAt: Date;
  } {
    const dev = this.devices.get(internalCode);
    if (!dev) throw new Error(`unknown device: ${internalCode}`);
    // Invalidate any existing token for the same device.
    for (const [key, tok] of this.tokens) {
      if (tok.deviceInternalCode === internalCode) this.tokens.delete(key);
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + CONNECT_TOKEN_TTL_MS;
    this.tokens.set(token, {
      deviceInternalCode: internalCode,
      expiresAt,
      used: false,
    });
    return { token, url: `/connect-whatsapp/${token}`, expiresAt: new Date(expiresAt) };
  }

  /// Public: resolve a token to its current state. Never reveals phone/session.
  resolveTokenState(token: string): ConnectState {
    const tok = this.tokens.get(token);
    if (!tok) return { kind: 'NOT_FOUND' };
    const dev = this.devices.get(tok.deviceInternalCode);
    if (!dev) return { kind: 'NOT_FOUND' };
    if (tok.used) {
      return { kind: 'USED', internalCode: dev.internalCode, displayName: dev.displayName };
    }
    if (Date.now() > tok.expiresAt) {
      return { kind: 'EXPIRED', internalCode: dev.internalCode, displayName: dev.displayName };
    }
    if (dev.status === 'READY') {
      return {
        kind: 'CONNECTED',
        internalCode: dev.internalCode,
        displayName: dev.displayName,
        maskedPhone: dev.normalizedPhone.slice(0, 4) + '…' + dev.normalizedPhone.slice(-4),
      };
    }
    if (dev.status === 'ERROR') {
      return {
        kind: 'ERROR',
        internalCode: dev.internalCode,
        displayName: dev.displayName,
        message: dev.lastError ?? 'unknown',
      };
    }
    if (dev.status === 'PAIRING') {
      return {
        kind: 'CONNECTING',
        internalCode: dev.internalCode,
        displayName: dev.displayName,
      };
    }
    // UNPAIRED / CONNECTING — show QR if available.
    const qr = dev.currentQr;
    if (qr && Date.now() < qr.expiresAt) {
      return {
        kind: 'QR_ACTIVE',
        internalCode: dev.internalCode,
        displayName: dev.displayName,
        qrPngPath: qr.qrPngPath,
        expiresInSeconds: Math.floor((qr.expiresAt - Date.now()) / 1000),
      };
    }
    return {
      kind: 'EXPIRED',
      internalCode: dev.internalCode,
      displayName: dev.displayName,
    };
  }

  /// Public: regenerate the QR for a token's bound device.
  /// Returns true if a fresh QR was triggered.
  async regenerateForToken(token: string): Promise<boolean> {
    const tok = this.tokens.get(token);
    if (!tok || tok.used || Date.now() > tok.expiresAt) return false;
    const dev = this.devices.get(tok.deviceInternalCode);
    if (!dev || !dev.transport) return false;
    try {
      // Re-initialize to get a fresh QR. whatsapp-web.js does not expose a
      // public regenerate(); restart of the transport is the smallest supported
      // mechanism. LocalAuth state is preserved.
      await dev.transport.stop();
      void dev.transport.start().catch(() => undefined);
      // Reset currentQr — transport will emit a new 'qr' event shortly.
      dev.currentQr = null;
      dev.status = 'CONNECTING';
      return true;
    } catch (err: any) {
      this.logger.warn(`🪪 regenerate failed for ${dev.internalCode}: ${err?.message ?? 'unknown'}`);
      return false;
    }
  }

  // --- internals ---------------------------------------------------------

  private async bootstrapDevice(d: {
    internalCode: string;
    displayName: string;
    rawPhone: string;
  }): Promise<void> {
    const normalizedPhone = normalizeIdPhone(d.rawPhone);
    if (!normalizedPhone) throw new Error(`phone cannot be normalized: ${d.rawPhone}`);

    const existing = await this.prisma.selfQrDevice.findUnique({
      where: { internalCode: d.internalCode },
    });
    const row = existing
      ? existing
      : await this.prisma.selfQrDevice.create({
          data: {
            internalCode: d.internalCode,
            displayName: d.displayName,
            normalizedPhone,
            phoneLast4: phoneLast4(normalizedPhone),
            provider: 'whatsapp-webjs',
            authStatePath: path.join(this.authRoot, d.internalCode),
            status: 'UNPAIRED',
            enabled: false, // off until operator triggers bootstrap; pairs do not auto-start here
          },
        });

    const state: DeviceState = {
      deviceId: row.id,
      internalCode: d.internalCode,
      displayName: d.displayName,
      normalizedPhone,
      transport: null,
      status: row.status,
      lastError: null,
      pairedAt: row.pairedAt,
      currentQr: null,
    };
    this.devices.set(d.internalCode, state);

    // Only auto-start transport for the pilot's LocalAuth that already exists.
    // For fresh Sales devices we wait for the admin to issue a connect-token;
    // the transport starts on demand inside the token handler.
    const authDir = path.join(this.authRoot, d.internalCode);
    if (fs.existsSync(path.join(authDir, 'session-luthfi-pilot'.replace('luthfi-pilot', d.internalCode.toLowerCase())))) {
      // legacy-style LocalAuth check — best effort, do nothing for fresh devices.
    }
  }

  /// Lazy-start the transport for a device when its first connect-token is
  /// issued. Called from the controller's token-create handler.
  async startDeviceTransport(internalCode: string): Promise<void> {
    const dev = this.devices.get(internalCode);
    if (!dev) throw new Error(`unknown device: ${internalCode}`);
    if (dev.transport) return; // already started
    const authDir = path.join(this.authRoot, internalCode);
    fs.mkdirSync(authDir, { recursive: true });
    const qrPngPath = path.join(authDir, 'qr.png');
    const transport = new WhatsappWebJsTransport({
      authDir,
      clientId: internalCode.toLowerCase(),
      chromePath: CHROME_PATH,
      qrOutPath: qrPngPath,
    });
    dev.transport = transport;

    transport.on('qr', (payload: { qr: string; qrPngPath: string }) => {
      dev.currentQr = {
        qr: payload.qr,
        qrPngPath: payload.qrPngPath,
        expiresAt: Date.now() + QR_REFRESH_MS,
      };
      dev.status = 'CONNECTING';
    });
    transport.on('authenticated', () => {
      dev.status = 'PAIRING';
    });
    const handleReady = async (): Promise<void> => {
      const wid = transport.getAuthenticatedWid();
      // Hard gate: SESSION_IDENTITY must equal the device's expected WID.
      const expected = `${dev.normalizedPhone}@c.us`;
      if (wid !== expected) {
        dev.status = 'ERROR';
        dev.lastError = `SESSION_IDENTITY_MISMATCH expected=${expected} got=${wid ?? 'null'}`;
        this.logger.error(`🪪 ${dev.lastError}`);
        // Invalidate all tokens for this device.
        for (const tok of this.tokens.values()) {
          if (tok.deviceInternalCode === internalCode) tok.used = true;
        }
        return;
      }
      dev.status = 'READY';
      dev.pairedAt = new Date();
      dev.currentQr = null;
      dev.lastError = null;
      // Invalidate all tokens for this device.
      for (const tok of this.tokens.values()) {
        if (tok.deviceInternalCode === internalCode) tok.used = true;
      }
      this.logger.log(`🪪 sales device ${dev.internalCode} PAIRED wid=${wid}`);
      if (dev.deviceId) {
        await this.prisma.selfQrDevice.update({
          where: { id: dev.deviceId },
          data: { status: 'READY', pairedAt: dev.pairedAt, lastReadyAt: new Date() },
        });
      }
    };
    // The listener signature returns void; the DB write stays awaited inside
    // handleReady.
    transport.on('ready', () => {
      void handleReady();
    });
    transport.on('disconnected', (info: { reason: string }) => {
      dev.lastError = info.reason ?? 'disconnected';
      dev.status = info.reason === 'auth_failure' ? 'LOGGED_OUT' : 'RECONNECTING';
    });

    void transport.start().catch((err: any) => {
      dev.lastError = err?.message ?? 'transport.start failed';
      dev.status = 'ERROR';
      this.logger.error(`🪪 transport.start failed for ${internalCode}: ${dev.lastError}`);
    });
  }
}
