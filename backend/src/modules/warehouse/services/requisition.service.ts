import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import {
  CreateRequisitionDto,
  IssueRequisitionDto,
  ReturnRequisitionDto,
  UpdateRequisitionStatusDto,
} from '../dto/requisition.dto';
import { QCStatus, RequisitionHeaderStatus } from '@prisma/client';

@Injectable()
export class RequisitionService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateRequisitionDto, userId: string) {
    const reqNumber = await this.idGenerator.generateId('REQ');

    return this.prisma.$transaction(async (tx) => {
      const header = await tx.materialRequisitionHeader.create({
        data: {
          reqNumber,
          requestDate: dto.requestDate ? new Date(dto.requestDate) : new Date(),
          fromWarehouse: dto.fromWarehouse,
          toWarehouse: dto.toWarehouse,
          notes: dto.notes,
          createdById: userId,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              qty: item.qty,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { material: true } } },
      });
      return header;
    });
  }

  async findAll() {
    return this.prisma.materialRequisitionHeader.findMany({
      include: {
        items: { include: { material: true } },
        requester: { select: { fullName: true } },
        fromWh: true,
        toWh: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const header = await this.prisma.materialRequisitionHeader.findUnique({
      where: { id },
      include: {
        items: { include: { material: true } },
        requester: { select: { fullName: true } },
        fromWh: true,
        toWh: true,
      },
    });
    if (!header) throw new NotFoundException('Requisition not found');
    return header;
  }

  async updateStatus(id: string, dto: UpdateRequisitionStatusDto) {
    const header = await this.prisma.materialRequisitionHeader.findUnique({
      where: { id },
    });
    if (!header) throw new NotFoundException('Requisition not found');

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      // FULFILLED is reached only by issue(), which writes stock ledger rows.
      // A generic status patch must never mutate or imply physical stock.
      APPROVED: [],
      REJECTED: [],
      FULFILLED: [],
    };

    const allowed = allowedTransitions[header.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${header.status} to ${dto.status}`,
      );
    }

    return this.prisma.materialRequisitionHeader.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  /** Sends the existing request once. It does not reserve stock or alter it on request creation. */
  async issue(id: string, dto: IssueRequisitionDto, performedBy: string) {
    if (!dto.idempotencyKey?.trim()) throw new BadRequestException('idempotencyKey is required');
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM material_requisition_headers WHERE id = ${id} FOR UPDATE`;
      const header = await tx.materialRequisitionHeader.findUnique({ where: { id }, include: { items: true } });
      if (!header) throw new NotFoundException('Requisition not found');
      if (header.issueCommandKey) {
        if (header.issueCommandKey === dto.idempotencyKey) return { ...header, idempotent: true };
        throw new BadRequestException('Requisition has already been sent');
      }
      if (header.status !== RequisitionHeaderStatus.APPROVED) throw new BadRequestException('Only an approved requisition can be sent');

      for (const item of header.items) {
        const wanted = Number(item.qty) - Number(item.qtyIssued);
        if (wanted <= 0) continue;
        let remaining = wanted;
        const lots = await tx.materialInventory.findMany({
          where: { materialId: item.materialId, qcStatus: QCStatus.GOOD, currentStock: { gt: 0 } },
          orderBy: [{ expDate: 'asc' }, { receivingDate: 'asc' }, { id: 'asc' }],
        });
        for (const lot of lots) {
          if (remaining <= 0) break;
          // This canonical requisition flow has no reservation command.  Do not
          // subtract the legacy cache field here: only released physical stock
          // is the sendable quantity for this Batch 5 operation.
          const quantity = Math.min(remaining, Number(lot.currentStock));
          if (quantity <= 0) continue;
          // The conditional write is the final concurrency gate: two sends
          // cannot consume the same released lot quantity.
          const changed = await tx.materialInventory.updateMany({
            where: { id: lot.id, qcStatus: QCStatus.GOOD, currentStock: { gte: quantity } },
            data: { currentStock: { decrement: quantity } },
          });
          if (changed.count !== 1) throw new BadRequestException('INSUFFICIENT_USABLE_STOCK');
          await tx.inventoryTransaction.create({ data: {
            materialId: item.materialId, inventoryId: lot.id, warehouseId: header.fromWarehouse,
            type: 'OUTBOUND', quantity, referenceNo: header.reqNumber,
            commandKey: `requisition-issue:${id}:${dto.idempotencyKey}:${lot.id}`,
            performedBy, notes: `WAREHOUSE_REQUISITION_ISSUE:${id}`,
          } });
          remaining -= quantity;
        }
        if (remaining > 0) throw new BadRequestException('INSUFFICIENT_USABLE_STOCK');
        await tx.materialRequisitionItem.update({ where: { id: item.id }, data: { qtyIssued: { increment: wanted } } });
        await tx.materialItem.update({ where: { id: item.materialId }, data: { stockQty: { decrement: wanted } } });
      }
      return tx.materialRequisitionHeader.update({
        where: { id }, data: { status: RequisitionHeaderStatus.FULFILLED, issueCommandKey: dto.idempotencyKey },
        include: { items: { include: { material: true } } },
      });
    });
  }

  /** Records a separate internal return; it never overwrites the original send. */
  async returnToWarehouse(id: string, dto: ReturnRequisitionDto, performedBy: string) {
    if (!dto.idempotencyKey?.trim() || !dto.items?.length) throw new BadRequestException('idempotencyKey and return items are required');
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM material_requisition_headers WHERE id = ${id} FOR UPDATE`;
      const header = await tx.materialRequisitionHeader.findUnique({ where: { id }, include: { items: true } });
      if (!header) throw new NotFoundException('Requisition not found');
      if (header.returnCommandKey) {
        if (header.returnCommandKey === dto.idempotencyKey) return { ...header, idempotent: true };
        throw new BadRequestException('A return has already been recorded for this requisition');
      }
      if (header.status !== RequisitionHeaderStatus.FULFILLED) throw new BadRequestException('Only sent material can be returned');
      for (const requested of dto.items) {
        const item = header.items.find((line) => line.id === requested.requisitionItemId);
        if (!item || !Number.isFinite(requested.qty) || requested.qty <= 0) throw new BadRequestException('Invalid return line');
        if (requested.qty > Number(item.qtyIssued) - Number(item.qtyReturned)) throw new BadRequestException('RETURN_EXCEEDS_SENT');
        let remaining = requested.qty;
        const originalIssues = await tx.inventoryTransaction.findMany({
          where: { referenceNo: header.reqNumber, materialId: item.materialId, type: 'OUTBOUND', notes: `WAREHOUSE_REQUISITION_ISSUE:${id}` },
          orderBy: { createdAt: 'asc' },
        });
        for (const issue of originalIssues) {
          if (remaining <= 0) break;
          const priorReturns = await tx.inventoryTransaction.aggregate({ _sum: { quantity: true }, where: { referenceNo: header.reqNumber, inventoryId: issue.inventoryId, type: 'RETURN', notes: { startsWith: `WAREHOUSE_REQUISITION_RETURN:${id}` } } });
          const quantity = Math.min(remaining, Number(issue.quantity) - Number(priorReturns._sum.quantity || 0));
          if (quantity <= 0 || !issue.inventoryId) continue;
          await tx.materialInventory.update({ where: { id: issue.inventoryId }, data: { currentStock: { increment: quantity } } });
          await tx.inventoryTransaction.create({ data: {
            materialId: item.materialId, inventoryId: issue.inventoryId, warehouseId: header.fromWarehouse,
            type: 'RETURN', quantity, referenceNo: header.reqNumber,
            commandKey: `requisition-return:${id}:${dto.idempotencyKey}:${issue.inventoryId}`,
            performedBy, notes: `WAREHOUSE_REQUISITION_RETURN:${id}${dto.reason ? `; ${dto.reason}` : ''}`,
          } });
          remaining -= quantity;
        }
        if (remaining > 0) throw new BadRequestException('RETURN_EXCEEDS_SENT');
        await tx.materialRequisitionItem.update({ where: { id: item.id }, data: { qtyReturned: { increment: requested.qty } } });
        await tx.materialItem.update({ where: { id: item.materialId }, data: { stockQty: { increment: requested.qty } } });
      }
      return tx.materialRequisitionHeader.update({ where: { id }, data: { returnCommandKey: dto.idempotencyKey }, include: { items: { include: { material: true } } } });
    });
  }
}
