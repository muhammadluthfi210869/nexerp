import { LeadCaptureService } from '../lead-capture.service';

/**
 * Unit test — AI extraction parser/validator (Fase 3.1)
 * Menguji logika murni `parseAndValidateExtraction` & `buildConversationText`
 * tanpa memanggil jaringan (LLM di-mock).
 */
describe('LeadCaptureService — AI extraction (Fase 3.1)', () => {
  let service: LeadCaptureService;

  beforeEach(() => {
    service = new LeadCaptureService({} as any);
  });

  const parse = (content: string) => (service as any).parseAndValidateExtraction(content);

  it('parse output JSON bersih dari LLM', () => {
    const out = parse(JSON.stringify({
      fullName: { value: 'Andi', confidence: 0.9, source: 'saya Andi' },
      company: { value: 'PT Maju Jaya', confidence: 0.8, source: 'dari PT Maju Jaya' },
      niche: { value: 'parfum', confidence: 0.95, source: 'brand parfum' },
      brand: { value: 'Aureon', confidence: 0.8, source: 'brand Aureon' },
      domisili: { value: 'Surabaya', confidence: 0.7, source: 'di surabaya' },
      moq: { value: 1000, confidence: 0.85, source: 'MOQ 1000 pcs' },
      budget: { value: '50 juta', confidence: 0.6, source: 'budget 50 juta' },
    }));

    expect(out.fullName).toEqual({ value: 'Andi', confidence: 0.9, source: 'saya Andi' });
    expect(out.moq).toEqual({ value: 1000, confidence: 0.85, source: 'MOQ 1000 pcs' });
    expect(out.niche.value).toBe('parfum');
    expect(out.brand.value).toBe('Aureon');
    expect(out.domisili.value).toBe('Surabaya');
  });

  it('membuang markdown code fence (```json ... ```)', () => {
    const out = parse('```json\n{"fullName": {"value": "Budi", "confidence": 1, "source": "saya Budi"}}\n```');
    expect(out.fullName.value).toBe('Budi');
  });

  it('null kalau field tidak ada di percakapan (anti-hallucination)', () => {
    const out = parse(JSON.stringify({
      fullName: { value: null, confidence: 0, source: null },
      company: { value: null, confidence: 0, source: null },
      productInterest: { value: null, confidence: 0, source: null },
      moq: { value: null, confidence: 0, source: null },
      budget: { value: null, confidence: 0, source: null },
    }));
    expect(out.fullName.value).toBeNull();
    expect(out.fullName.confidence).toBe(0);
  });

  it('moq menolak nilai non-angka / bukan positif', () => {
    const out = parse(JSON.stringify({
      moq: { value: 'seribu', confidence: 0.9, source: 'MOQ seribu' },
    }));
    expect(out.moq.value).toBeNull();
    expect(out.moq.confidence).toBe(0);
  });

  it('confidence di-clamp ke rentang 0-1', () => {
    const out = parse(JSON.stringify({
      fullName: { value: 'Andi', confidence: 1.7, source: 'saya Andi' },
      moq: { value: 100, confidence: -3, source: 'MOQ 100' },
    }));
    expect(out.fullName.confidence).toBe(1);
    expect(out.moq.confidence).toBe(0);
  });

  it('output LLM tidak valid → null (ditolak, tidak masuk CRM)', () => {
    expect(parse('ini bukan json sama sekali')).toBeNull();
    expect(parse('')).toBeNull();
  });

  it('parse saran stage (Fase 3.3) — hanya menerima WorkflowStatus yang valid', () => {
    const out = parse(JSON.stringify({
      stage: { stage: 'SAMPLE_REQUESTED', confidence: 0.9, reason: 'customer minta sampel', source: 'minta sampel dong' },
    }));
    expect(out.stage.stage).toBe('SAMPLE_REQUESTED');
    expect(out.stage.reason).toBe('customer minta sampel');

    // stage tidak valid di enum → ditolak
    const bad = parse(JSON.stringify({ stage: { stage: 'TIDAK_ADA_STAGE', confidence: 0.9, reason: 'x' } }));
    expect(bad.stage.stage).toBeNull();
    expect(bad.stage.confidence).toBe(0);
  });

  it('buildConversationText menyusun pesan terurut dengan timestamp', () => {
    const text = (service as any).buildConversationText([
      { body: 'Halo', waName: 'Luthfi', createdAt: new Date('2026-08-10T00:00:00Z') },
      { body: 'MOQ 1000', waName: null, createdAt: new Date('2026-08-10T00:01:00Z') },
    ]);
    expect(text).toContain('[customer (Luthfi)]: Halo');
    expect(text).toContain('[customer]: MOQ 1000');
    expect(text.indexOf('MOQ 1000')).toBeGreaterThan(text.indexOf('Halo'));
  });
});

describe('LeadCaptureService — confirmAiStage (Fase 3.3)', () => {
  let service: LeadCaptureService;
  const prismaMock = {
    leadCapture: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadCaptureService(prismaMock as any);
  });

  it('menerapkan saran stage ke workflowStatus dan membersihkan aiStage', async () => {
    prismaMock.leadCapture.findUnique.mockResolvedValue({
      id: 'lead-1',
      workflowStatus: 'NEW_LEAD',
      aiStage: { stage: 'NEGOTIATION', confidence: 0.8, reason: 'tawar harga', source: 'bisa kurang dikit?' },
    });
    prismaMock.leadCapture.update.mockResolvedValue({ id: 'lead-1', workflowStatus: 'NEGOTIATION' });

    const result = await service.confirmAiStage('lead-1');

    expect(prismaMock.leadCapture.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: expect.objectContaining({
        workflowStatus: 'NEGOTIATION',
        aiStage: expect.anything(), // Prisma.DbNull (clear JSON field)
        aiStatus: 'CONFIRMED',
      }),
    });
    expect(result.workflowStatus).toBe('NEGOTIATION');
  });

  it('melempar error kalau tidak ada saran stage', async () => {
    prismaMock.leadCapture.findUnique.mockResolvedValue({ id: 'lead-1', workflowStatus: 'NEW_LEAD', aiStage: null });
    await expect(service.confirmAiStage('lead-1')).rejects.toThrow();
  });
});

describe('LeadCaptureService — confirmAttribute (Fase 3.2, Option B)', () => {
  let service: LeadCaptureService;
  const prismaMock = {
    leadAttribute: {
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    leadCapture: {
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadCaptureService(prismaMock as any);
  });

  it('konfirmasi fullName → ikut menulis kolom lead fullName (first-class)', async () => {
    prismaMock.leadAttribute.findFirst.mockResolvedValue({ id: 'a1', key: 'fullName', value: 'Andi', confirmed: false });
    prismaMock.leadAttribute.update.mockResolvedValue({ id: 'a1', key: 'fullName', value: 'Andi', confirmed: true });
    prismaMock.leadAttribute.count.mockResolvedValue(0);
    prismaMock.leadCapture.update.mockResolvedValue({ id: 'lead-1' });

    await service.confirmAttribute('lead-1', 'a1', { confirmed: true });

    expect(prismaMock.leadCapture.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fullName: 'Andi' }) }),
    );
    // setelah semua terkonfirmasi → aiStatus CONFIRMED
    expect(prismaMock.leadCapture.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ aiStatus: 'CONFIRMED' }) }),
    );
  });

  it('konfirmasi atribut biasa (niche) TIDAK menulis kolom lead', async () => {
    prismaMock.leadAttribute.findFirst.mockResolvedValue({ id: 'a2', key: 'niche', value: 'parfum', confirmed: false });
    prismaMock.leadAttribute.update.mockResolvedValue({ id: 'a2', key: 'niche', value: 'parfum', confirmed: true });
    prismaMock.leadAttribute.count.mockResolvedValue(1);

    await service.confirmAttribute('lead-1', 'a2', { confirmed: true });

    // Tidak ada panggilan leadCapture.update dengan fullName/company
    const calls = prismaMock.leadCapture.update.mock.calls;
    const dataFields = calls.map((c: any[]) => c[0]?.data).filter(Boolean);
    expect(dataFields.some((d: any) => 'fullName' in d)).toBe(false);
    expect(dataFields.some((d: any) => 'company' in d)).toBe(false);
  });
});

