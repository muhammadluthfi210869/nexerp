import { LeadCaptureService } from '../lead-capture.service';

/**
 * Unit test — dedup lead orphan (Fase 2.1)
 *
 * Aturan QA: fitur baru → test reproduksi. Test ini membuktikan bahwa
 * `upsertOrphanLead`:
 *  1. Update lead yang SUDAH ADA kalau nomor yang sama chat lagi dalam window
 *     (bukan bikin lead baru / doppelganger).
 *  2. Membuat orphan lead BARU kalau tidak ada lead dengan nomor tersebut.
 */
describe('LeadCaptureService — upsertOrphanLead (dedup Fase 2.1 + log Fase 2.2)', () => {
  let service: LeadCaptureService;
  const prismaMock = {
    leadCapture: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    leadMessage: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: tidak ada pesan lama dengan msgId sama → create berjalan
    prismaMock.leadMessage.findUnique.mockResolvedValue(null);
    prismaMock.leadMessage.create.mockResolvedValue({ id: 'msg-1' });
    service = new LeadCaptureService(prismaMock as any);
  });

  it('update lead yang ada kalau nomor sama chat lagi dalam window (bukan bikin baru)', async () => {
    const existing = {
      id: 'lead-1',
      trackingCode: 'DLAAA111',
      phone: '6289531681278',
      waMessage: 'haloo',
      status: 'WA_CONTACTED',
      workflowStatus: 'NEW_LEAD',
      createdAt: new Date(),
    };
    prismaMock.leadCapture.findFirst.mockResolvedValue(existing);
    prismaMock.leadCapture.update.mockResolvedValue({
      ...existing,
      waMessage: 'test nexerp',
    });

    await service.upsertOrphanLead('+6289531681278', 'Luthfi', 'test nexerp');

    // Query dedup: nomor ternormalisasi + status masih aktif + dalam window
    expect(prismaMock.leadCapture.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        phone: '6289531681278',
        status: { notIn: ['CONVERTED', 'DISQUALIFIED'] },
        workflowStatus: { notIn: ['WON_DEAL', 'LOST', 'ABORTED'] },
      }),
      orderBy: { createdAt: 'desc' },
    });

    // Update lead lama — BUKAN create lead baru
    expect(prismaMock.leadCapture.update).toHaveBeenCalled();
    expect(prismaMock.leadCapture.create).not.toHaveBeenCalled();

    // Fase 2.2: pesan masuk dicatat ke log percakapan, terhubung ke lead yang sama
    expect(prismaMock.leadMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        direction: 'INBOUND',
        phone: '6289531681278',
        body: 'test nexerp',
      }),
    });
  });

  it('bikin orphan lead baru kalau tidak ada lead dengan nomor yang sama', async () => {
    prismaMock.leadCapture.findFirst.mockResolvedValue(null);

    const newLead = {
      id: 'lead-2',
      trackingCode: 'DLNEW999',
      phone: '6289531681278',
      status: 'PENDING',
      workflowStatus: 'NEW_LEAD',
    };
    prismaMock.leadCapture.create.mockResolvedValue(newLead);
    prismaMock.leadCapture.findUnique.mockResolvedValue(newLead);
    prismaMock.leadCapture.update.mockResolvedValue({ ...newLead, status: 'WA_CONTACTED' });

    await service.upsertOrphanLead('6289531681278', 'Luthfi', 'haloo');

    // Karena tidak ada lead lama → buat lead baru (track → create) lalu updateFromWhatsApp
    expect(prismaMock.leadCapture.create).toHaveBeenCalled();
    expect(prismaMock.leadCapture.update).toHaveBeenCalled();
  });

  it('normalisasi nomor: buang karakter non-digit', async () => {
    prismaMock.leadCapture.findFirst.mockResolvedValue(null);
    const newLead = {
      id: 'lead-3',
      trackingCode: 'DLNEW888',
      phone: '6289531681278',
      status: 'PENDING',
      workflowStatus: 'NEW_LEAD',
    };
    prismaMock.leadCapture.create.mockResolvedValue(newLead);
    prismaMock.leadCapture.findUnique.mockResolvedValue(newLead);
    prismaMock.leadCapture.update.mockResolvedValue(newLead);

    // Nomor dikirim dengan +62 dan spasi — harus dinormalisasi ke digit murni
    await service.upsertOrphanLead('+62 895-3168-1278', 'Luthfi', 'haloo');

    expect(prismaMock.leadCapture.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ phone: '6289531681278' }),
      orderBy: { createdAt: 'desc' },
    });
  });

  it('tidak membuat baris LeadMessage duplikat kalau msgId sudah tercatat (redelivery webhook)', async () => {
    prismaMock.leadMessage.findUnique.mockResolvedValue({ id: 'msg-existing', msgId: 'wamid.ABC' });

    const existing = {
      id: 'lead-1',
      trackingCode: 'DLAAA111',
      phone: '6289531681278',
      waMessage: 'haloo',
      status: 'WA_CONTACTED',
      workflowStatus: 'NEW_LEAD',
      createdAt: new Date(),
    };
    prismaMock.leadCapture.findFirst.mockResolvedValue(existing);
    prismaMock.leadCapture.update.mockResolvedValue({ ...existing, waMessage: 'haloo' });

    // Webhook yang SAMA dikirim ulang oleh Meta (msgId sama)
    await service.upsertOrphanLead('6289531681278', 'Luthfi', 'haloo', 'wamid.ABC');

    // Pesan tidak dicatat dua kali
    expect(prismaMock.leadMessage.create).not.toHaveBeenCalled();
  });
});

