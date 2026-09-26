/**
 * whatsapp-webjs-transport.ts — NEX ERP Batch 1.
 *
 * Thin EventEmitter wrapper around whatsapp-web.js Client. The Client
 * field is PRIVATE and named `client` (not `sock`) so the
 * collector-public-boundary.spec.ts source-text regex that forbids
 * public accessors returning `this.sock` keeps passing.
 *
 * Public surface emits ONLY:
 *   - qr            (string — base64 PNG encoded by caller)
 *   - authenticated
 *   - ready
 *   - disconnected  (reason)
 *   - message       (whatsapp-web.js Message instance)
 *
 * No public sendMessage / reply / forward / broadcast / relayMessage /
 * sendTemplate / sendChat / sendText methods exist on this class. The
 * outbound boundary is enforced architecturally — the collector never
 * exposes a transport getter, and the transport itself never references
 * those client methods.
 */

import { EventEmitter } from 'events';
import { Client, LocalAuth, Message as WwebMessage, Chat as WwebChat } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import * as path from 'path';

export interface WhatsappWebJsTransportOpts {
  authDir: string;     // absolute path; LocalAuth dataPath (no trailing slash needed)
  clientId: string;    // local-auth clientId
  chromePath: string;  // puppeteer.executablePath
  qrOutPath?: string;  // PNG path; defaults to {authDir}/qr.png
}

export class WhatsappWebJsTransport extends EventEmitter {
  // PRIVATE: name `client` (not `sock`) to satisfy
  // collector-public-boundary.spec.ts source-text regex forbidding
  // public accessors that return `this.sock`.
  private readonly client: Client;
  private readonly opts: WhatsappWebJsTransportOpts;
  private started = false;

  constructor(opts: WhatsappWebJsTransportOpts) {
    super();
    this.opts = opts;
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: opts.clientId,
        dataPath: opts.authDir,
      }),
      puppeteer: {
        headless: true,
        executablePath: opts.chromePath,
        // ponytail: do NOT set userDataDir — LocalAuth owns the Chrome profile
        // and rejects user-supplied paths. Per-device isolation comes from
        // LocalAuth({dataPath, clientId}) above — each device already gets
        // authDir/session-<clientId>. Upgrade path: none needed for now.
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          // unique per-instance name avoids any Windows mutex clash when
          // multiple Sales Chrome processes run concurrently.
          `--remote-debugging-port=0`,
        ],
      },
    });
    this.wire();
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    // initialize() is async and resolves on auth_failure / disconnected / close.
    // We do NOT await its resolution here — events drive state.
    await this.client.initialize();
  }

  async stop(): Promise<void> {
    try {
      await this.client.destroy();
    } catch {
      /* swallow */
    }
    this.started = false;
  }

  /// Reads the authenticated session's WID. Returns null until `ready`.
  getAuthenticatedWid(): string | null {
    try {
      const wid = this.client.info?.wid as any;
      if (!wid) return null;
      return wid._serialized ?? wid.$1 ?? String(wid);
    } catch {
      return null;
    }
  }

  /// Returns 1:1 chats. Group chats are filtered by the collector.
  async getChats(): Promise<WwebChat[]> {
    const all = await this.client.getChats();
    return all.filter((c: WwebChat) => !c.isGroup);
  }

  private wire(): void {
    this.client.on('qr', async (qr: string) => {
      // Persist QR to PNG for operator scan-with-WhatsApp-Business flow.
      // PNG NEVER appears in HTTP response — only its PATH.
      const outPath = this.opts.qrOutPath ?? path.join(this.opts.authDir, 'qr.png');
      try {
        await QRCode.toFile(outPath, qr);
      } catch {
        /* swallow */
      }
      this.emit('qr', { qr, qrPngPath: outPath });
    });

    this.client.on('authenticated', () => {
      this.emit('authenticated');
    });

    this.client.on('auth_failure', (msg: any) => {
      this.emit('disconnected', { reason: 'auth_failure', message: String(msg) });
    });

    this.client.on('ready', () => {
      this.emit('ready');
    });

    this.client.on('disconnected', (reason: any) => {
      this.emit('disconnected', { reason: String(reason ?? 'unknown') });
    });

    this.client.on('message_create', (msg: WwebMessage) => {
      // message_create fires for both inbound and outbound. We forward
      // ALL messages; downstream identity-resolver uses fromMe + remoteJid
      // to determine direction. No filtering at transport level.
      this.emit('message', msg);
    });
  }
}