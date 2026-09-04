import { Test, TestingModule } from '@nestjs/testing';
import { OutboundCounterService } from '../outbound-counter.service';

function mockPrisma(overrides: Record<string, any> = {}) {
  const defaultMethods = ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete', 'count', 'aggregate'];
  const collections = [
    'leadCapture', 'leadMessage', 'leadValidationLog', 'leadAttribute',
    'user', 'account', 'activityStream', 'bussdevStaff',
  ];

  const prisma: any = {
    $transaction: jest.fn((fn: any) => fn(prisma)),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    ...overrides,
  };

  for (const col of collections) {
    const obj: Record<string, jest.Mock> = {};
    for (const method of defaultMethods) {
      obj[method] = jest.fn();
    }
    prisma[col] = obj;
  }
  return prisma;
}

describe('OutboundCounterService', () => {
  let service: OutboundCounterService;
  let prisma: any;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboundCounterService,
        { provide: 'PrismaService', useValue: prisma },
      ],
    }).compile();

    service = module.get(OutboundCounterService);
  });

  it('transitions to COLD on first reply', async () => {
    prisma.leadCapture.update
      .mockResolvedValueOnce({ id: 'lead-1', outboundReplyCount: 1, workflowStatus: 'NEW_LEAD' })
      .mockResolvedValueOnce({ id: 'lead-1', outboundReplyCount: 1, workflowStatus: 'COLD' });
    prisma.leadValidationLog.create.mockResolvedValue({});

    await service.recordBusdevReply('lead-1');

    expect(prisma.leadCapture.update).toHaveBeenCalledTimes(2);
    expect(prisma.leadValidationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'APPROVAL',
        input: 'outboundReplyCount=1',
      }),
    });
  });

  it('transitions to WARM on fifth reply', async () => {
    prisma.leadCapture.update
      .mockResolvedValueOnce({ id: 'lead-2', outboundReplyCount: 5, workflowStatus: 'COLD' })
      .mockResolvedValueOnce({ id: 'lead-2', outboundReplyCount: 5, workflowStatus: 'WARM' });
    prisma.leadValidationLog.create.mockResolvedValue({});

    await service.recordBusdevReply('lead-2');

    expect(prisma.leadCapture.update).toHaveBeenCalledTimes(2);
    expect(prisma.leadValidationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-2',
        type: 'APPROVAL',
        input: 'outboundReplyCount=5',
      }),
    });
  });

  it('does NOT transition to HOT at 10th reply', async () => {
    prisma.leadCapture.update
      .mockResolvedValueOnce({ id: 'lead-3', outboundReplyCount: 10, workflowStatus: 'WARM' });
    prisma.leadValidationLog.create.mockResolvedValue({});

    await service.recordBusdevReply('lead-3');

    // Only the increment call, no stage update
    expect(prisma.leadCapture.update).toHaveBeenCalledTimes(1);
    expect(prisma.leadCapture.update).toHaveBeenCalledWith({
      where: { id: 'lead-3' },
      data: { outboundReplyCount: { increment: 1 } },
    });
    expect(prisma.leadValidationLog.create).not.toHaveBeenCalled();
  });
});
