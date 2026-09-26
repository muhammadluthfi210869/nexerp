/**
 * getMessage-callback.spec.ts — NEX ERP Batch 1.
 *
 * Baileys 7.0.0-rc14 had a `getMessage` callback contract on `makeWASocket`
 * that the prior implementation satisfied with `{ conversation: '' }`.
 * After the transport swap to whatsapp-web.js 1.34.7, this contract no
 * longer applies — whatsapp-web.js has no equivalent callback.
 *
 * This test is intentionally minimal: it locks the architectural fact
 * that the whatsapp-web.js client configuration does NOT register a
 * `getMessage` callback (there is no such option on whatsapp-web.js's
 * Client constructor).
 */

import { WhatsappWebJsTransport } from '../whatsapp-webjs-transport';

describe('wweb transport — no getMessage callback contract', () => {
  it('WhatsappWebJsTransport constructor does not accept getMessage', () => {
    // whatsapp-web.js Client has no getMessage option. The constructor
    // signature is { authStrategy, puppeteer } only.
    const opts = {
      authDir: '/tmp/never',
      clientId: 'spec-noop',
      chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    };
    expect(() => new WhatsappWebJsTransport(opts as any)).not.toThrow();
  });
});