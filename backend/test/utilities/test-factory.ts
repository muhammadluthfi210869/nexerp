import { faker } from '@faker-js/faker';
import {
  WorkflowStatus,
  SampleStage,
  SOStatus,
  LostReason,
  Division,
  StreamEventType,
} from '@prisma/client';

export class TestFactory {
  static createLeadDto(overrides?: Partial<Record<string, any>>) {
    return {
      clientName: faker.company.name(),
      brandName: faker.commerce.productName(),
      contactInfo: faker.internet.email(),
      source: 'REFERRAL',
      productInterest: faker.commerce.product(),
      estimatedValue: parseFloat(
        faker.finance.amount({ min: 10_000_000, max: 500_000_000 }),
      ),
      picId: 'STAFF-DEFAULT-ID',
      category: 'COSMETICS',
      notes: faker.lorem.sentence(),
      moq: faker.number.int({ min: 100, max: 10000 }),
      planOmset: parseFloat(
        faker.finance.amount({ min: 50_000_000, max: 1_000_000_000 }),
      ),
      hkiMode: 'NEW',
      paymentType: 'PREPAID',
      isRepeatOrder: false,
      ...overrides,
    };
  }

  static createAdvanceLeadDto(overrides?: Partial<Record<string, any>>) {
    return {
      newStatus: WorkflowStatus.CONTACTED,
      notes: faker.lorem.sentence(),
      loggedBy: 'test-user',
      paymentProofUrl: undefined,
      downPaymentAmount: 0,
      lostReason: undefined,
      ...overrides,
    };
  }

  static createSampleRequestDto(overrides?: Partial<Record<string, any>>) {
    return {
      leadId: 'LEAD-ID',
      productName: faker.commerce.productName(),
      stage: SampleStage.QUEUE,
      targetDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targetFunction: 'General Skincare',
      textureReq: 'Standard',
      colorReq: 'Natural',
      aromaReq: 'Fresh',
      ...overrides,
    };
  }

  static createSampleRequest(overrides?: Partial<Record<string, any>>) {
    return {
      id: faker.string.uuid(),
      sampleCode: `SMP-${faker.string.alphanumeric(8).toUpperCase()}`,
      leadId: 'LEAD-ID',
      productName: faker.commerce.productName(),
      stage: SampleStage.QUEUE,
      createdAt: new Date(),
      updatedAt: new Date(),
      targetDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targetFunction: 'General Skincare',
      textureReq: 'Standard',
      colorReq: 'Natural',
      aromaReq: 'Fresh',
      ...overrides,
    };
  }

  static createSalesOrderDto(overrides?: Partial<Record<string, any>>) {
    return {
      leadId: 'LEAD-ID',
      brandName: faker.commerce.productName(),
      totalAmount: parseFloat(
        faker.finance.amount({ min: 50_000_000, max: 1_000_000_000 }),
      ),
      quantity: faker.number.int({ min: 100, max: 10000 }),
      status: SOStatus.PENDING_DP,
      ...overrides,
    };
  }

  static createUser(
    role: string = 'SUPER_ADMIN',
    overrides?: Partial<Record<string, any>>,
  ) {
    return {
      id: faker.string.uuid(),
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      password: '$2b$10$hashedpassword',
      roles: [role],
      managerPin: '$2b$10$hashedpin',
      status: 'ACTIVE',
      ...overrides,
    };
  }

  static createLead(overrides?: Partial<Record<string, any>>) {
    return {
      id: faker.string.uuid(),
      clientName: faker.company.name(),
      brandName: faker.commerce.productName(),
      status: WorkflowStatus.NEW_LEAD,
      picId: 'STAFF-ID',
      bdId: 'USER-ID',
      estimatedValue: 100_000_000,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastStageAt: new Date(),
      statusDuration: 0,
      isEmergencyOverride: false,
      ...overrides,
    };
  }

  static createActivityStream(overrides?: Partial<Record<string, any>>) {
    return {
      id: faker.string.uuid(),
      leadId: 'LEAD-ID',
      senderDivision: Division.BD,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Test activity',
      loggedBy: 'SYSTEM',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createJournalEntry(balanced: boolean = true) {
    const amount = parseFloat(
      faker.finance.amount({ min: 1000, max: 1_000_000_000 }),
    );
    return {
      id: faker.string.uuid(),
      refId: faker.string.uuid(),
      refType: 'SALES_ORDER',
      description: faker.lorem.sentence(),
      debitAmount: balanced ? amount : amount + 1,
      creditAmount: amount,
      createdAt: new Date(),
    };
  }

  static createInventory(overrides?: Partial<Record<string, any>>) {
    return {
      id: faker.string.uuid(),
      materialId: faker.string.uuid(),
      batchNumber: `BATCH-${faker.string.alphanumeric(6).toUpperCase()}`,
      quantity: faker.number.int({ min: 10, max: 1000 }),
      unitValue: faker.number.int({ min: 1000, max: 100000 }),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ...overrides,
    };
  }

  static positiveCases<T>(cases: T[], generator: () => T): T[] {
    return cases.map((override) => ({ ...generator(), ...override }));
  }
}
