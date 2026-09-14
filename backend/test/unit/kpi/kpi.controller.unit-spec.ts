// KpiController unit tests — verifies role guards + delegation to service.

import { Test, TestingModule } from '@nestjs/testing';
import { KpiController } from '../../../src/modules/kpi/kpi.controller';
import { KpiService } from '../../../src/modules/kpi/kpi.service';
import { JwtAuthGuard } from '../../../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../../src/modules/auth/roles.guard';
import { Division } from '@prisma/client';

describe('KpiController', () => {
  let controller: KpiController;
  let service: jest.Mocked<KpiService>;

  const mockService = {
    computePerson: jest.fn(),
    computeDivision: jest.fn(),
    getDashboardMetrics: jest.fn(),
    topPerformers: jest.fn(),
    periodLast7Days: jest.fn(),
    periodThisMonth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpiController],
      providers: [{ provide: KpiService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KpiController>(KpiController);
    service = module.get(KpiService);
    jest.clearAllMocks();
  });

  it('delegates me() to computePerson with user.sub from JWT', async () => {
    const req = { user: { sub: 'me-id' } } as any;
    service.computePerson.mockResolvedValue({ userId: 'me-id' } as any);
    await controller.me({ from: '2026-01-01' }, req);
    expect(service.computePerson).toHaveBeenCalledWith(
      'me-id',
      expect.objectContaining({
        from: expect.any(Date),
      }),
    );
  });

  it('delegates person() to computePerson with route param', async () => {
    service.computePerson.mockResolvedValue({} as any);
    await controller.person('target-id', { from: '2026-01-01' });
    expect(service.computePerson).toHaveBeenCalledWith(
      'target-id',
      expect.objectContaining({ from: expect.any(Date) }),
    );
  });

  it('delegates division() to computeDivision', async () => {
    service.computeDivision.mockResolvedValue({} as any);
    await controller.division(Division.BD, { from: '2026-01-01' });
    expect(service.computeDivision).toHaveBeenCalledWith(
      Division.BD,
      expect.objectContaining({ from: expect.any(Date) }),
    );
  });

  it('delegates divisionMetrics() to getDashboardMetrics', async () => {
    service.getDashboardMetrics.mockResolvedValue({} as any);
    await controller.divisionMetrics(Division.FINANCE, {});
    expect(service.getDashboardMetrics).toHaveBeenCalledWith(
      Division.FINANCE,
      {},
    );
  });

  it('clamps leaderboard limit between 1 and 100', async () => {
    service.topPerformers.mockResolvedValue([]);

    await controller.leaderboard({ limit: '500' });
    expect(service.topPerformers).toHaveBeenLastCalledWith(
      expect.anything(),
      100,
    );

    await controller.leaderboard({ limit: '0' });
    expect(service.topPerformers).toHaveBeenLastCalledWith(
      expect.anything(),
      1,
    );

    await controller.leaderboard({ limit: 'abc' });
    expect(service.topPerformers).toHaveBeenLastCalledWith(
      expect.anything(),
      10,
    );
  });
});