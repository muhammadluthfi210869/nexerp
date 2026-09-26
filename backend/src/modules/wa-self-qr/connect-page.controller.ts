/**
 * connect-page.controller.ts — NEX ERP Batch 3.
 *
 * PUBLIC endpoints for the minimal Sales-facing QR connection page.
 *
 * No JWT. The opaque token IS the auth. Token is 32-byte random hex,
 * 5-minute TTL, single-device mapping, becomes unusable after successful
 * pairing. No ERP or message data is exposed.
 *
 * Surface (all under /connect-whatsapp/<token>):
 *   GET  /:token          → HTML page (state-driven)
 *   GET  /:token/state    → JSON state (page polls this every 2s)
 *   GET  /:token/qr.png   → QR PNG (if active)
 *   POST /:token/regenerate → trigger fresh QR (rate-limited; expires after pairing)
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { SalesDeviceManager, ConnectState } from './sales-device-manager';

@Controller('connect-whatsapp')
export class ConnectPageController {
  constructor(private readonly sales: SalesDeviceManager) {}

  @Get('health')
  health(): { status: string; service: string } {
    return { status: 'ok', service: 'wa-self-qr' };
  }

  @Get(':token')
  servePage(@Param('token') token: string, @Res() res: Response): void {
    const state = this.sales.resolveTokenState(token);
    res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-store')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(renderPage(state, token));
  }

  @Get(':token/state')
  serveState(@Param('token') token: string): ConnectState {
    return this.sales.resolveTokenState(token);
  }

  @Get(':token/qr.png')
  serveQrPng(@Param('token') token: string, @Res() res: Response): void {
    const state = this.sales.resolveTokenState(token);
    if (state.kind !== 'QR_ACTIVE') {
      throw new HttpException('no active qr', HttpStatus.GONE);
    }
    if (!fs.existsSync(state.qrPngPath)) {
      throw new HttpException('qr png missing', HttpStatus.NOT_FOUND);
    }
    res
      .status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Cache-Control', 'no-store')
      .send(fs.readFileSync(state.qrPngPath));
  }

  @Post(':token/regenerate')
  async regenerate(@Param('token') token: string): Promise<{ ok: boolean }> {
    const ok = await this.sales.regenerateForToken(token);
    return { ok };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline HTML — minimal, plain Bahasa Indonesia, no design system, no JS libs.
// One JS poll loop calls /state every 2s and swaps innerHTML on state.kind change.
// ─────────────────────────────────────────────────────────────────────────────

function renderPage(state: ConnectState, token: string): string {
  const escapedName = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const base = `
<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Hubungkan WhatsApp — ${escapedName(displayNameOf(state))}</title>
<style>
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0b1220;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  .card{max-width:420px;width:100%;background:#111c2e;border:1px solid #1f2a44;border-radius:12px;padding:28px}
  h1{font-size:20px;margin:0 0 4px;font-weight:600}
  .sub{color:#8b97ad;margin:0 0 22px;font-size:14px}
  .qr{width:260px;height:260px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:14px auto;padding:8px}
  .qr img{width:100%;height:100%;display:block}
  .ttl{text-align:center;font-size:13px;color:#8b97ad;margin-top:4px}
  .steps{background:#0e1a2d;border:1px solid #1c2a45;border-radius:8px;padding:14px;margin-top:18px;font-size:14px;line-height:1.55}
  .steps b{color:#e6edf3}
  .btn{display:block;width:100%;text-align:center;background:#2563eb;color:#fff;border:0;border-radius:8px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;margin-top:14px}
  .btn:hover{background:#1d4ed8}
  .ok{color:#22c55e;text-align:center;font-weight:600;font-size:16px;margin:6px 0}
  .err{color:#ef4444;text-align:center;font-size:14px;margin:6px 0;word-break:break-word}
  .muted{color:#8b97ad;text-align:center;font-size:13px}
</style>
</head>
<body>
<div class="card" id="card">
${renderBody(state, token)}
</div>
<script>
(function(){
  var token = ${JSON.stringify(token)};
  var lastKind = ${JSON.stringify(state.kind)};
  function refresh(){
    fetch('/api/connect-whatsapp/' + token + '/state', {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(s){ if (s && s.kind !== lastKind) location.reload(); })
      .catch(function(){});
  }
  setInterval(refresh, 2000);
})();
</script>
</body>
</html>`.trim();
  return base;
}

function displayNameOf(s: ConnectState): string {
  if (s.kind === 'NOT_FOUND') return 'Tidak ditemukan';
  return s.displayName;
}

function renderBody(state: ConnectState, token: string): string {
  const name = displayNameOf(state);
  if (state.kind === 'NOT_FOUND') {
    return `
<h1>Tidak ditemukan</h1>
<p class="sub">Tautan koneksi tidak valid atau telah kedaluwarsa.</p>
<p class="muted">Minta admin untuk menerbitkan tautan baru.</p>`;
  }
  if (state.kind === 'USED') {
    return `
<h1>WhatsApp berhasil terhubung</h1>
<p class="sub">Perangkat ${escapeHtml(name)} telah terpasang. Tautan koneksi tidak dapat digunakan lagi.</p>
<p class="muted">Halaman ini dapat ditutup.</p>`;
  }
  if (state.kind === 'EXPIRED') {
    return `
<h1>Kode QR sudah kedaluwarsa</h1>
<p class="sub">Tautan untuk ${escapeHtml(name)} masih berlaku, namun QR-nya sudah kadaluarsa.</p>
<p class="muted">Tekan tombol di bawah untuk membuat QR baru.</p>
<form method="POST" action="/api/connect-whatsapp/${escapeHtml(token)}/regenerate">
<button class="btn" type="submit">BUAT QR BARU</button>
</form>`;
  }
  if (state.kind === 'CONNECTING') {
    return `
<h1>Menghubungkan WhatsApp</h1>
<p class="sub">Perangkat ${escapeHtml(name)} sedang memindai kode QR…</p>
<p class="muted">Mohon tunggu sebentar.</p>`;
  }
  if (state.kind === 'CONNECTED') {
    return `
<h1>WhatsApp berhasil terhubung</h1>
<p class="ok">✓ ${escapeHtml(name)} siap menerima pesan.</p>
<p class="sub">Nomor perangkat: ${escapeHtml(state.maskedPhone)}</p>
<p class="muted">Halaman ini dapat ditutup.</p>`;
  }
  if (state.kind === 'ERROR') {
    return `
<h1>Koneksi gagal</h1>
<p class="err">${escapeHtml(state.message)}</p>
<p class="muted">Hubungi admin untuk mencoba ulang dengan tautan baru.</p>`;
  }
  // QR_ACTIVE
  const expiresSec = state.expiresInSeconds;
  return `
<h1>Hubungkan WhatsApp</h1>
<p class="sub">${escapeHtml(name)} — pindai kode QR di bawah ini.</p>
<div class="qr"><img src="/api/connect-whatsapp/${escapeHtml(token)}/qr.png" alt="QR"></div>
<div class="ttl">QR berlaku selama <span id="ttl">${expiresSec}</span> detik</div>
<div class="steps">
<b>Cara memindai:</b><br>
WhatsApp Business → <b>Setelan</b> → <b>Perangkat Tertaut</b> → <b>Tautkan Perangkat</b><br>
Arahkan kamera ke QR di atas.
</div>
<p class="muted">Menunggu koneksi...</p>
<script>
(function(){
  var t = ${expiresSec};
  var el = document.getElementById('ttl');
  var iv = setInterval(function(){
    t--;
    if (el) el.textContent = String(Math.max(0, t));
    if (t <= 0) { clearInterval(iv); location.reload(); }
  }, 1000);
})();
</script>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
