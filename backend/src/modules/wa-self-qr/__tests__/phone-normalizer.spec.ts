import {
  normalizeIdPhone,
  extractCustomerPhoneFromJid,
  phoneLast4,
} from '../phone-normalizer';

describe('phone-normalizer', () => {
  describe('normalizeIdPhone', () => {
    it('accepts local 08 prefix', () => {
      expect(normalizeIdPhone('0881023221414')).toBe('62881023221414');
    });
    it('accepts +62 prefix', () => {
      expect(normalizeIdPhone('+62881023221414')).toBe('62881023221414');
    });
    it('accepts 62 prefix', () => {
      expect(normalizeIdPhone('62881023221414')).toBe('62881023221414');
    });
    it('strips JID suffix on a PN JID', () => {
      expect(normalizeIdPhone('62881023221414@s.whatsapp.net')).toBe('62881023221414');
    });

    it('returns null on a non-mobile LID JID (never guess)', () => {
      // Conservative: the digits before @lid do not start with 62 so this
      // cannot be a valid ID mobile — never invent one.
      expect(normalizeIdPhone('1234:5@lid')).toBeNull();
    });
    it('returns null on garbage / empty / non-string', () => {
      expect(normalizeIdPhone('abc')).toBeNull();
      expect(normalizeIdPhone(null)).toBeNull();
      expect(normalizeIdPhone(undefined)).toBeNull();
      expect(normalizeIdPhone('')).toBeNull();
      expect(normalizeIdPhone(123 as any)).toBeNull();
    });
    it('rejects non-62 numbers without leading 0', () => {
      expect(normalizeIdPhone('19876543210')).toBeNull();
      expect(normalizeIdPhone('12345678')).toBeNull();
    });
    it('produces stable canonical form for three equivalent inputs', () => {
      expect(normalizeIdPhone('0881023221414'))
        .toBe(normalizeIdPhone('62881023221414'));
      expect(normalizeIdPhone('+62881023221414'))
        .toBe(normalizeIdPhone('62881023221414'));
    });
  });

  describe('extractCustomerPhoneFromJid', () => {
    it('extracts from a PN @s.whatsapp.net JID', () => {
      expect(extractCustomerPhoneFromJid('6281023221414@s.whatsapp.net'))
        .toBe('6281023221414');
    });
    it('returns null for a LID JID without 62-prefixed digits', () => {
      // Conservative — never guess a phone from a LID.
      expect(extractCustomerPhoneFromJid('1234:5@lid')).toBeNull();
    });
  });

  describe('phoneLast4', () => {
    it('returns last 4 digits of canonical', () => {
      expect(phoneLast4('62881023221414')).toBe('1414');
    });
    it('returns empty for null', () => {
      expect(phoneLast4(null)).toBe('');
    });
  });
});
