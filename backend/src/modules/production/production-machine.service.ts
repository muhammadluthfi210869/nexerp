/**
 * Fase 3C (part 8) — the machine registry leaves ProductionService.
 *
 * The seven slices before this one were cut on mutability (analytics), one
 * record type (batch records), deciding when work happens (planning), recording
 * an outcome (actuals), the floor itself (execution), and the decision a
 * supervisor makes (QC audit). This one is cut on *the assets the floor is
 * scheduled against*: which machines exist, and which of them are free.
 *
 * Measured before the move, not assumed:
 *
 *   ranges 310-312 and 328-346 — three methods, prisma and nothing else
 *   `getAllRequisitions` sits between the two ranges and did NOT move: it is the
 *     material requisition list, the same resource `issueMaterial` and
 *     `flagShortage` write to, so it leaves with that cluster
 *   zero references to any of the three names anywhere else in the facade
 *   no strings of its own — the bodies are pure prisma calls, which is why the
 *     tests assert on the query shapes instead of on messages
 *
 * Two of the three have no route in production.controller.ts and no caller
 * anywhere in backend/src or frontend/src: `createMachine` and
 * `getActiveMachines`. They are **moved, not deleted**. Removing public surface
 * is a decision about intended-but-unwired features, not a refactor step; the
 * finding is recorded in the QA gate report (§14.1) with the evidence.
 *
 * The facade stays: production.controller.ts:24 calls `getMachines`, and two
 * frontend screens call that route.
 */

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class ProductionMachineService {
  constructor(private prisma: PrismaService) {}

  async createMachine(dto: any) {
    return await this.prisma.machine.create({ data: dto });
  }

  async getMachines(category?: string) {
    return await this.prisma.machine.findMany({
      where: category ? { type: category as any } : {},
      orderBy: { name: 'asc' },
    });
  }

  async getActiveMachines() {
    return await this.prisma.machine.findMany({
      where: { isActive: true },
      include: {
        productionLogs: {
          where: { goodQty: 0, rejectQty: 0 },
          include: { workOrder: true },
          take: 1,
        },
      },
    });
  }
}
