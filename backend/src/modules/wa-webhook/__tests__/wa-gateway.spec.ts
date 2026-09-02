import { WaWebhookService } from '../wa-webhook.service';

/**
 * Unit test — adapter gateway pihak ketiga (Wablas/Mesolitica/Fonnte).
 * Format payload fleksibel + normalisasi nomor ke 628xx + tracking code bridge.
 */
describe('WaWebhookService — handleGateway', () => {
  let service: WaWebhookService;
  const leadCaptureMock = {
    upsertOrphanLead: jest.fn().mockResolvedValue({}),
    updateFromWhatsApp: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WaWebhookService(leadCaptureMock as any);
  });

  it('Wablas format: from + text + name', async () => {
    await service.handleGateway({ from: '081234567890', text: 'Halo test', name: 'Budi' });
    expect(leadCaptureMock.upsertOrphanLead).toHaveBeenCalledWith(
      '6281234567890', 'Budi', 'Halo test', undefined,
    );
  });

  it('Mesolitica format: data.from + data.message + data.msg_id', async () => {
    await service.handleGateway({
      data: { from: '081234567890', message: 'MOQ berapa', name: 'Andi', msg_id: 'MSG-1' },
    });
    expect(leadCaptureMock.upsertOrphanLead).toHaveBeenCalledWith(
      '6281234567890', 'Andi', 'MOQ berapa', 'MSG-1',
    );
  });

  it('tracking code → updateFromWhatsApp (bukan orphan)', async () => {
    await service.handleGateway({ from: '081234567890', text: 'Halo [Kode: DLABC123]' });
    expect(leadCaptureMock.updateFromWhatsApp).toHaveBeenCalledWith(
      'DLABC123', expect.objectContaining({ phone: '6281234567890' }),
    );
    expect(leadCaptureMock.upsertOrphanLead).not.toHaveBeenCalled();
  });

  it('payload tidak lengkap → incomplete (tanpa create)', async () => {
    const res = await service.handleGateway({ name: 'x' });
    expect(res.status).toBe('incomplete');
    expect(leadCaptureMock.upsertOrphanLead).not.toHaveBeenCalled();
  });

  it('normalisasi: nomor sudah 62 / ada + tidak dobel', async () => {
    await service.handleGateway({ from: '+6281234567890', text: 'halo' });
    expect(leadCaptureMock.upsertOrphanLead).toHaveBeenCalledWith(
      '6281234567890', 'Unknown', 'halo', undefined,
    );
  });
});

