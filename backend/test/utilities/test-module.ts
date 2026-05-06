import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';

interface MockProvider {
  token: any;
  value: any;
}

export class TestModule {
  /**
   * Create a testing module for a service with mock providers.
   */
  static async forService(
    ServiceClass: new (...args: any[]) => any,
    mocks: MockProvider[] = [],
    imports: any[] = [],
  ): Promise<TestingModule> {
    const providers: Provider[] = [
      ServiceClass,
      ...mocks.map((m) => ({
        provide: m.token,
        useValue: m.value,
      })),
    ];

    return Test.createTestingModule({
      imports,
      providers,
    }).compile();
  }

  /**
   * Returns a mock PrismaService with jest.fn() for all standard collection methods.
   */
  static mockPrisma(
    overrides: Record<string, any> = {},
  ): Partial<PrismaService> {
    const defaultMethods = [
      'findUnique',
      'findFirst',
      'findMany',
      'create',
      'update',
      'delete',
      'count',
      'aggregate',
    ];
    const collections = [
      'user',
      'salesLead',
      'sampleRequest',
      'salesOrder',
      'invoice',
      'leadActivity',
      'activityStream',
      'stateTransitionLog',
      'systemOverrideLog',
      'materialItem',
      'supplier',
      'inventoryTransaction',
      'productionLog',
      'formula',
      'designTask',
      'designVersion',
      'regulatoryPipeline',
      'bussdevStaff',
      'newProductForm',
      'materialInventory',
      'materialValuation',
      'workOrder',
      'materialRequisition',
      'qCAudit',
      'fundRequest',
      'account',
      'journalEntry',
      'hkiRecord',
      'bpomRecord',
      'legalTimelineLog',
      'legalityLog',
      'leadTimelineLog',
      'designFeedback',
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

  /**
   * Create a mock for EventEmitter2.
   */
  static mockEventEmitter() {
    return {
      emit: jest.fn(),
      emitAsync: jest.fn().mockResolvedValue([]),
      on: jest.fn(),
      once: jest.fn(),
    };
  }
}
