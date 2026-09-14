import { LeadCaptureService } from '../lead-capture.service';

describe('LeadCaptureService.classifyIntent', () => {
  let service: LeadCaptureService;

  beforeEach(() => {
    service = new LeadCaptureService({} as any);
  });

  it('classifies skincare inquiry as PROSPEK', async () => {
    const result = await service.classifyIntent(
      'Halo, saya mau tanya soal maklon skincare',
    );
    expect(result.intent).toBe('PROSPEK');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies pinjol message as SPAM', async () => {
    const result = await service.classifyIntent(
      'Pinjam online cair 5 juta cepat',
    );
    expect(['SPAM', 'JUNK']).toContain(result.intent);
  });

  it('returns UNCLEAR on error without throwing', async () => {
    const original = globalThis.fetch;
    (globalThis as any).fetch = async () => {
      throw new Error('network fail');
    };
    try {
      const result = await service.classifyIntent('test');
      expect(result.intent).toBe('UNCLEAR');
      expect(result.confidence).toBe(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
