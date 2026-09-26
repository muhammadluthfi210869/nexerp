import { composeDedupHash, composeExternalMessageId } from '../dedup-key';

describe('dedup-key', () => {
  it('hashes a known rawMessageKey identically', () => {
    const a = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: 'msg:abc-123',
    });
    const b = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: 'msg:abc-123',
    });
    expect(a).toBe(b);
  });

  it('different rawMessageKey => different hash', () => {
    const a = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: 'msg:abc-123',
    });
    const b = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: 'msg:abc-999',
    });
    expect(a).not.toBe(b);
  });

  it('different device => different hash (key namespace)', () => {
    const a = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: 'msg:abc-123',
    });
    const b = composeDedupHash({
      deviceInternalCode: 'JESSICA-1',
      rawMessageKey: 'msg:abc-123',
    });
    expect(a).not.toBe(b);
  });

  it('uses fallback path when rawMessageKey is missing', () => {
    const a = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: null,
      fallbackFrom: {
        remoteJid: '62812345678901@s.whatsapp.net',
        fromMe: false,
        whatsappTimestampSeconds: 1690000000,
      },
    });
    const b = composeDedupHash({
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: null,
      fallbackFrom: {
        remoteJid: '62812345678901@s.whatsapp.net',
        fromMe: false,
        whatsappTimestampSeconds: 1690000001,
      },
    });
    expect(a).not.toBe(b);
  });

  it('fallback path is order-stable given same inputs', () => {
    const input = {
      deviceInternalCode: 'LUTHFI-1',
      rawMessageKey: undefined,
      fallbackFrom: {
        remoteJid: 'x',
        fromMe: true,
        whatsappTimestampSeconds: 1,
      },
    };
    expect(composeDedupHash(input)).toBe(composeDedupHash(input));
  });

  it('composeExternalMessageId uses rawMessageKey verbatim when present', () => {
    expect(
      composeExternalMessageId({ deviceInternalCode: 'L', rawMessageKey: 'k1' }),
    ).toBe('k1');
  });

  it('composeExternalMessageId falls back to a synthesized id otherwise', () => {
    const id = composeExternalMessageId({
      deviceInternalCode: 'L',
      rawMessageKey: null,
      fallbackFrom: {
        remoteJid: 'r',
        fromMe: true,
        whatsappTimestampSeconds: 1,
      },
    });
    expect(id).toContain('synth');
    expect(id).toContain('m=1');
    expect(id).toContain('t=1');
  });
});
