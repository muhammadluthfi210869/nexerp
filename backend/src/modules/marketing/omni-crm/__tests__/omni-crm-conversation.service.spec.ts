import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { OmniCrmConversationService } from '../omni-crm-conversation.service';

describe('OmniCrmConversationService outbound safety', () => {
  const prisma = {
    leadCapture: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    leadMessage: {
      create: jest.fn(),
    },
  };
  const outboundCounter = { recordBusdevReply: jest.fn() };
  let service: OmniCrmConversationService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    for (let index = 1; index <= 20; index += 1) {
      delete process.env[`BUSDEV_${index}_PHONE_NUMBER_ID`];
    }
    service = new OmniCrmConversationService(prisma as any, outboundCounter as any);
    prisma.leadCapture.findUnique.mockResolvedValue({
      id: '9fb82626-b815-41b1-81ef-675244f6374a',
      phone: '628123456789',
    });
    prisma.leadCapture.update.mockResolvedValue({});
    prisma.leadMessage.create.mockResolvedValue({
      id: 'message-id',
      direction: 'OUTBOUND',
      phone: '628123456789',
      body: 'Halo',
      createdAt: new Date('2026-09-09T00:00:00Z'),
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reports readiness without exposing tokens or Meta phone-number ids', () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = 'secret-token';
    process.env.BUSDEV_1_PHONE_NUMBER_ID = 'secret-phone-id';

    expect(service.getGatewayStatus()).toEqual({
      configured: true,
      tokenConfigured: true,
      configuredAccountCount: 1,
      live: false,
    });
  });

  it('rejects an unconfigured account before persisting a false sent message', async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = 'secret-token';
    delete process.env.BUSDEV_2_PHONE_NUMBER_ID;

    await expect(service.sendOutbound({
      leadId: '9fb82626-b815-41b1-81ef-675244f6374a',
      phone: '08123456789',
      message: 'Halo',
      accountKey: 'BUSDEV_2',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.leadMessage.create).not.toHaveBeenCalled();
  });

  it('does not persist when Meta rejects the message', async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = 'secret-token';
    process.env.BUSDEV_1_PHONE_NUMBER_ID = 'secret-phone-id';
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'rejected' } }),
    } as Response);

    await expect(service.sendOutbound({
      leadId: '9fb82626-b815-41b1-81ef-675244f6374a',
      phone: '08123456789',
      message: 'Halo',
      accountKey: 'BUSDEV_1',
    })).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.leadMessage.create).not.toHaveBeenCalled();
  });
});
