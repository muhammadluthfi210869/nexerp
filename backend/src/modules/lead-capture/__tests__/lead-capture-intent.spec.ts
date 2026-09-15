import { LeadCaptureService } from '../lead-capture.service';

describe('LeadCaptureService.classifyIntent', () => {
  let service: LeadCaptureService;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    service = new LeadCaptureService({} as any);
    originalFetch = globalThis.fetch;

    // ponytail: mock fetch to return canned LLM response based on input text.
    // Production uses real MiniMax API; tests must be hermetic.
    globalThis.fetch = (async (_url: any, init?: any) => {
      const body = init?.body ? JSON.parse(init.body) : {};
      const userText: string = body.messages?.find((m: any) => m.role === 'user')?.content ?? '';
      const lower = userText.toLowerCase();
      const isSpam = /pinjam|pinjol|slot|gacor|cair/.test(lower);
      const intent = isSpam ? 'SPAM' : 'PROSPEK';
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ intent, confidence: 0.9 }) } }],
        }),
      } as any;
    }) as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
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
