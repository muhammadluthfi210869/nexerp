import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, PRPriority, PRStatus, Division, StreamEventType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import { UpdateGoodsRequirementStatusDto } from '../dto/goods-requirement.dto';

/** A requirement snapshots one committed SO revision; it is never a live Formula view. */
@Injectable()
export class GoodsRequirementService {
  constructor(private prisma: PrismaService, private idGenerator: IdGeneratorService, private eventEmitter: EventEmitter2) {}

  async generateFromCommittedSalesOrder(salesOrderId: string, actorId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { lead: { select: { id: true } }, items: true, formula: { include: { phases: { include: { items: { include: { material: true } } } } } } },
    });
    if (!so) throw new NotFoundException('Sales Order not found');
    if (!so.committedAt) throw new BadRequestException('REQUIREMENT_SO_NOT_COMMITTED: committedAt is required.');
    if (!so.formula) throw new BadRequestException('REQUIREMENT_FORMULA_MISSING: committed SO has no pinned Formula.');

    // Formula dosage is percentage of a gram-based Formula. SO item netto is
    // the only deterministic output-mass basis available in the current model.
    const outputGrams = so.items.reduce((sum, line) => sum.plus(new Prisma.Decimal(line.netto).mul(line.quantity)), new Prisma.Decimal(0));
    if (outputGrams.lte(0)) throw new BadRequestException('REQUIREMENT_OUTPUT_BASIS_INVALID: Sales Order lines need positive netto and quantity.');
    if (new Prisma.Decimal(so.formula.targetYieldGram).lte(0)) throw new BadRequestException('REQUIREMENT_FORMULA_YIELD_INVALID: Formula target yield must be positive.');

    const components = new Map<string, { qty: Prisma.Decimal; dosage: Prisma.Decimal; uom: string }>();
    for (const phase of so.formula.phases) for (const item of phase.items) {
      if (!item.materialId || !item.material) throw new BadRequestException('REQUIREMENT_COMPONENT_UNMAPPED: Formula has a component without a Material master link.');
      const dosage = new Prisma.Decimal(item.dosagePercentage);
      if (dosage.lte(0)) throw new BadRequestException('REQUIREMENT_COMPONENT_QTY_INVALID: Formula component dosage must be positive.');
      // Formula composition has GR semantics.  The current master has no UOM
      // conversion relation, so a non-GR component must become an exception.
      if (item.material.unit !== 'GR') throw new BadRequestException(`REQUIREMENT_UOM_CONVERSION_UNAVAILABLE: ${item.material.name} is ${item.material.unit}; no trusted GR conversion exists.`);
      const old = components.get(item.materialId);
      components.set(item.materialId, { qty: old ? old.qty.plus(outputGrams.mul(dosage).div(100)) : outputGrams.mul(dosage).div(100), dosage: old ? old.dosage.plus(dosage) : dosage, uom: item.material.unit });
    }
    if (!components.size) throw new BadRequestException('REQUIREMENT_COMPONENTS_MISSING: pinned Formula has no procurable components.');

    const unique = { salesOrderId_salesOrderVersion: { salesOrderId, salesOrderVersion: so.version } };
    const existing = await this.prisma.goodsRequirement.findUnique({ where: unique, include: { items: true } });
    if (existing) return { requirement: existing, idempotent: true };
    const code = await this.idGenerator.generateId('NGR');
    try {
      const requirement = await this.prisma.goodsRequirement.create({
        data: { code, salesOrderId: so.id, salesOrderVersion: so.version, formulaId: so.formulaId!, formulaVersion: so.formula.version, date: new Date(), status: 'GENERATED', createdById: actorId,
          items: { create: [...components.entries()].map(([materialId, c]) => ({ materialId, qty: c.qty.toDecimalPlaces(2), uom: c.uom, dosagePercentage: c.dosage })) } },
        include: { items: true },
      });
      this.eventEmitter.emit(ACTIVITY_EVENT, { leadId: so.lead.id, senderDivision: Division.SCM, eventType: StreamEventType.HANDOVER, loggedBy: actorId, notes: `Requirement ${requirement.code} derived from ${so.orderNumber} revision ${so.version}.`, payload: { requirementId: requirement.id, salesOrderId: so.id, salesOrderVersion: so.version, formulaId: so.formulaId, formulaVersion: so.formula.version } });
      return { requirement, idempotent: false };
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
      return { requirement: await this.prisma.goodsRequirement.findUniqueOrThrow({ where: unique, include: { items: true } }), idempotent: true };
    }
  }

  async createPurchaseRequestFromRequirement(requirementId: string, actorId: string, input: { warehouseId: string; supplierId?: string; priority?: PRPriority; notes?: string; idempotencyKey: string; unitPrices?: Array<{ requirementItemId: string; unitPrice: number }> }) {
    const requirement = await this.prisma.goodsRequirement.findUnique({ where: { id: requirementId }, include: { items: true } });
    if (!requirement) throw new NotFoundException('Goods Requirement not found');
    if (requirement.status === 'CHANGE_REQUIRED') throw new BadRequestException('REQUIREMENT_CHANGE_REQUIRED: resolve the newer SO revision before procuring this requirement.');
    if (!input.idempotencyKey) throw new BadRequestException('PR_IDEMPOTENCY_KEY_REQUIRED');
    const where = { requirementId, idempotencyKey: input.idempotencyKey };
    const pricesByRequirementItem = new Map((input.unitPrices ?? []).map((price) => [price.requirementItemId, price.unitPrice]));
    if ([...pricesByRequirementItem.values()].some((price) => !Number.isFinite(price) || price < 0)) {
      throw new BadRequestException('PR_PRICE_INVALID: agreed unit prices must be non-negative numbers.');
    }
    const existing = await this.prisma.purchaseRequest.findFirst({ where, include: { items: true } });
    if (existing) return { purchaseRequest: existing, idempotent: true };
    try {
      const purchaseRequest = await this.prisma.purchaseRequest.create({
        data: { ...where, warehouseId: input.warehouseId, supplierId: input.supplierId, priority: input.priority ?? PRPriority.MEDIUM, status: PRStatus.SUBMITTED, notes: input.notes, createdById: actorId,
          // Material, quantity, and UOM remain the immutable Requirement truth.
          // The only line-level fact accepted here is the newly agreed supplier price.
          items: { create: requirement.items.map((item) => ({ materialId: item.materialId, qtyRequired: item.qty, requirementItemId: item.id, estimatedPrice: pricesByRequirementItem.get(item.id) })) } },
        include: { items: { include: { material: true } }, requirement: true },
      });
      return { purchaseRequest, idempotent: false };
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
      return { purchaseRequest: await this.prisma.purchaseRequest.findFirstOrThrow({ where, include: { items: true } }), idempotent: true };
    }
  }

  async findAll() { return this.prisma.goodsRequirement.findMany({ include: { items: true, purchaseRequests: { select: { id: true, status: true } } }, orderBy: { createdAt: 'desc' } }); }
  async findOne(id: string) { const req = await this.prisma.goodsRequirement.findUnique({ where: { id }, include: { items: true, purchaseRequests: true } }); if (!req) throw new NotFoundException('Goods Requirement not found'); return req; }
  async updateStatus(id: string, dto: UpdateGoodsRequirementStatusDto) { await this.findOne(id); return this.prisma.goodsRequirement.update({ where: { id }, data: { status: dto.status } }); }
}
