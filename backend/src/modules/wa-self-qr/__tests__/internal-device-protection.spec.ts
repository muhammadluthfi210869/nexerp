import {
  isInternalDevice,
  _resetInternalDeviceCacheForTests,
} from '../internal-device-protection';

describe('internal-device-protection', () => {
  beforeEach(() => _resetInternalDeviceCacheForTests());
  afterEach(() => _resetInternalDeviceCacheForTests());

  it('treats known internal Sales phone as internal', () => {
    process.env.SELF_QR_INTERNAL_DEVICE_PHONES = '62881023221414';
    _resetInternalDeviceCacheForTests();
    expect(isInternalDevice('62881023221414')).toBe(true);
  });

  it('does not flag an unknown phone as internal', () => {
    process.env.SELF_QR_INTERNAL_DEVICE_PHONES = '62881023221414';
    _resetInternalDeviceCacheForTests();
    expect(isInternalDevice('6289531681278')).toBe(false);
  });

  it('parses comma-separated env list', () => {
    process.env.SELF_QR_INTERNAL_DEVICE_PHONES = '62881023221414,6287776550657';
    _resetInternalDeviceCacheForTests();
    expect(isInternalDevice('62881023221414')).toBe(true);
    expect(isInternalDevice('6287776550657')).toBe(true);
  });

  it('empty env => empty protection set (no false-positive blocking)', () => {
    delete process.env.SELF_QR_INTERNAL_DEVICE_PHONES;
    _resetInternalDeviceCacheForTests();
    expect(isInternalDevice('62881023221414')).toBe(false);
  });

  it('returns false for null canon', () => {
    expect(isInternalDevice(null)).toBe(false);
  });
});
