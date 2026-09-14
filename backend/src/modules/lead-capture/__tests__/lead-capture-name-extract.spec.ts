import { LeadCaptureService } from '../lead-capture.service';

describe('LeadCaptureService.extractName', () => {
  let service: LeadCaptureService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MINIMAX_BASE_URL: 'https://api.minimax.chat',
      MINIMAX_API_KEY: 'test-key',
      MINIMAX_MODEL: 'MiniMax-M3',
    };
    service = new LeadCaptureService({} as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('extracts name from explicit introduction', async () => {
    const original = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      ({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: '{"name":"Ahmad","confidence":0.92}' } },
          ],
        }),
      }) as any;
    const result = await service.extractName(
      'Halo, nama saya Ahmad dari Jakarta',
    );
    expect(result.name).toBe('Ahmad');
    expect(result.confidence).toBeGreaterThan(0.85);
    globalThis.fetch = original;
  });

  it('returns null for messages without a name', async () => {
    const original = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"name":null,"confidence":0.0}' } }],
        }),
      }) as any;
    const result = await service.extractName('Berapa harga maklon skincare?');
    expect(result.name).toBeNull();
    globalThis.fetch = original;
  });

  it('returns lower confidence for ambiguous name', async () => {
    const original = globalThis.fetch;
    (globalThis as any).fetch = async () =>
      ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"name":null,"confidence":0.3}' } }],
        }),
      }) as any;
    const result = await service.extractName('Saya mau order');
    expect(result.confidence).toBeLessThan(0.85);
    globalThis.fetch = original;
  });

  it('returns null on LLM error without throwing', async () => {
    const original = globalThis.fetch;
    (globalThis as any).fetch = async () => {
      throw new Error('network fail');
    };
    const result = await service.extractName('test');
    expect(result.name).toBeNull();
    expect(result.confidence).toBe(0);
    globalThis.fetch = original;
  });
});
