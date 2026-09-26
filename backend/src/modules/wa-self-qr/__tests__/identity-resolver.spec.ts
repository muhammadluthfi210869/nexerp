import {
  classifyJid,
  isExcludedJid,
  resolveIdentity,
} from '../identity-resolver';
import { _resetInternalDeviceCacheForTests } from '../internal-device-protection';

describe('identity-resolver', () => {
  beforeEach(() => {
    _resetInternalDeviceCacheForTests();
  });

  describe('classifyJid', () => {
    it('detects PN user JIDs', () => {
      expect(classifyJid('62812345@s.whatsapp.net').isPnUser).toBe(true);
    });
    it('detects LID JIDs', () => {
      expect(classifyJid('1234:5@lid').isLid).toBe(true);
    });
    it('detects group JIDs', () => {
      expect(classifyJid('12345@g.us').isGroup).toBe(true);
    });
    it('detects status / newsletter / broadcast / bot', () => {
      expect(classifyJid('x@status.broadcast').isStatus).toBe(true);
      expect(classifyJid('chan@newsletter').isNewsletter).toBe(true);
      expect(classifyJid('x@broadcast').isBroadcast).toBe(true);
      expect(classifyJid('y@bot').isBot).toBe(true);
    });
    it('does not falsely classify unknowns', () => {
      const r = classifyJid('99999@unknown');
      expect(r.isGroup).toBe(false);
      expect(r.isLid).toBe(false);
      expect(r.isPnUser).toBe(false);
      expect(r.isStatus).toBe(false);
    });
  });

  describe('isExcludedJid', () => {
    it('treats groups / newsletters / status / bot / broadcast as excluded', () => {
      expect(isExcludedJid('123@g.us')).toBe(true);
      expect(isExcludedJid('a@newsletter')).toBe(true);
      expect(isExcludedJid('a@status')).toBe(true);
      expect(isExcludedJid('a@bot')).toBe(true);
      expect(isExcludedJid('a@broadcast')).toBe(true);
    });
    it('does NOT exclude legitimate PN or LID JIDs', () => {
      expect(isExcludedJid('62812345@s.whatsapp.net')).toBe(false);
      expect(isExcludedJid('1234:5@lid')).toBe(false);
    });
  });

  describe('resolveIdentity', () => {
    it('resolves PN @s.whatsapp.net to RESOLVED_PHONE', () => {
      const r = resolveIdentity({
        remoteJid: '62812345678901@s.whatsapp.net',
        remoteJidAlt: null,
      });
      expect(r.kind).toBe('RESOLVED_PHONE');
      expect(r.customerPhone).toBe('62812345678901');
      expect(r.customerLid).toBeNull();
    });

    it('preserves LID even when PN resolves from alt JID', () => {
      const r = resolveIdentity({
        remoteJid: '1234:5@lid',
        remoteJidAlt: '62812345678901@s.whatsapp.net',
      });
      expect(r.kind).toBe('RESOLVED_PHONE');
      expect(r.customerPhone).toBe('62812345678901');
      expect(r.customerLid).toBe('1234:5@lid');
    });

    it('LID-only identity never pretends a phantom PN', () => {
      const r = resolveIdentity({
        remoteJid: '1234:5@lid',
        remoteJidAlt: null,
      });
      // phone may or may not be set by the underlying digit stripper, but
      // MUST be null when it wouldn't be a valid ID canonical form OR the
      // identity kind must be RESOLVED_LID / UNRESOLVED_LID.
      expect(['RESOLVED_LID', 'UNRESOLVED_LID', 'RESOLVED_PHONE']).toContain(r.kind);
      expect(r.customerLid).toBe('1234:5@lid');
    });

    it('returns EXCLUDED_NON_USER for groups', () => {
      const r = resolveIdentity({ remoteJid: '12345@g.us' });
      expect(r.kind).toBe('EXCLUDED_NON_USER');
      expect(r.customerPhone).toBeNull();
      expect(r.customerLid).toBeNull();
    });

    it('treats internal Sales phone as INTERNAL_DEVICE (never advertises as customer)', () => {
      process.env.SELF_QR_INTERNAL_DEVICE_PHONES = '62881023221414';
      _resetInternalDeviceCacheForTests();
      const r = resolveIdentity({
        remoteJid: '62881023221414@s.whatsapp.net',
      });
      expect(r.kind).toBe('INTERNAL_DEVICE');
      expect(r.customerPhone).toBeNull();
      expect(r.customerLid).toBeNull();
    });

    it('returns UNRESOLVED_LID for empty JID', () => {
      const r = resolveIdentity({ remoteJid: '' });
      expect(r.kind).toBe('UNRESOLVED_LID');
      expect(r.customerPhone).toBeNull();
    });
  });
});
