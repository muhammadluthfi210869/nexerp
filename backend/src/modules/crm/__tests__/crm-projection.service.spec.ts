import { LeadSource } from '@prisma/client';
import { CrmProjectionService } from '../common/crm-projection.service';

describe('CrmProjectionService', () => {
  const prisma: any = {
    leadCapture: { upsert: jest.fn() },
  };
  const events: any = { emit: jest.fn() };
  let service: CrmProjectionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CrmProjectionService(prisma, events);
  });

  it('normalizes Indonesian phone numbers consistently', () => {
    expect(service.normalizePhone('+62 812-3456-7890')).toBe('6281234567890');
    expect(service.normalizePhone('081234567890')).toBe('6281234567890');
    expect(service.normalizePhone(null)).toBeNull();
  });

  it('keeps raw attribution while mapping reporting channels', () => {
    expect(service.normalizeSource('google-ads')).toEqual({
      source: LeadSource.GOOGLE,
      sourceRaw: 'google-ads',
      sourceChannel: 'GOOGLE_ADS',
    });
    expect(service.normalizeSource('metaads').sourceChannel).toBe('META_ADS');
    expect(service.normalizeSource('organic').sourceChannel).toBe('ORGANIC');
  });

  it('ingests a tracked lead before phone/name enrichment is available', async () => {
    prisma.leadCapture.upsert.mockResolvedValue({ id: 'capture-1' });
    jest.spyOn(service, 'syncLeadCapture').mockResolvedValue({ id: 'crm-1' } as any);

    await service.ingestExternal({ trackingCode: 'DLABC123', source: 'organic' });

    expect(prisma.leadCapture.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { trackingCode: 'DLABC123' },
      create: expect.objectContaining({ phone: null, source: LeadSource.WEBSITE }),
    }));
    expect(service.syncLeadCapture).toHaveBeenCalledWith('capture-1', 'organic', undefined);
  });
});
