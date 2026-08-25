import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInboundDto, UpdateInboundStatusDto } from '../dto/inbound.dto';
import { InboundStatus, POStatus, QCStatus } from '@prisma/client';
import { IdGeneratorService } from '../../system/id-generator.service';

/** A Goods Receipt is a physical event. PO status is only a derived summary. */
@Injectable()
export class InboundsService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private idGenerator: IdGeneratorService) {}

  async create(dto: CreateInboundDto) {
    if (!dto.items?.length) throw new BadRequestException('Receipt requires at least one line');
    if (new Set(dto.items.map((item) => item.materialId)).size !== dto.items.length) throw new BadRequestException('A material may appear only once per receipt');
    if (dto.idempotencyKey) {
      const existing = await this.prisma.warehouseInbound.findUnique({ where: { idempotencyKey: dto.idempotencyKey }, include: { items: true } });
      if (existing) return { ...existing, idempotent: true };
    }
    const inboundNumber = await this.idGenerator.generateId('GRN');
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        // Lock before reading received quantities. Merely touching updatedAt
        // after the read permits two READ COMMITTED transactions to validate
        // the same remaining quantity.
        await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id = ${dto.poId} FOR UPDATE`;
        const po = await tx.purchaseOrder.findUnique({ where: { id: dto.poId }, include: { items: true } });
        if (!po) throw new NotFoundException('Purchase Order not found');
        if (![POStatus.ORDERED, POStatus.SHIPPED, POStatus.RECEIVED].includes(po.status)) throw new BadRequestException(`PO ${po.poNumber} is not issued for receiving`);
        for (const item of (dto.items as Array<{ materialId: string; qtyActual: number }>)) {
          const poLine = po.items.find((line: { materialId: string }) => line.materialId === item.materialId);
          if (!Number.isFinite(item.qtyActual) || item.qtyActual <= 0) throw new BadRequestException('Received quantity must be positive');
          if (!poLine) throw new BadRequestException(`Material ${item.materialId} is not on this PO`);
          if (item.qtyActual > Number(poLine.quantity) - Number(poLine.receivedQty)) throw new BadRequestException(`OVER_RECEIVE: ${item.materialId}`);
        }
        const inbound = await tx.warehouseInbound.create({ data: {
          inboundNumber, poId: dto.poId, warehouseId: dto.warehouseId, status: InboundStatus.PENDING,
          supplierReference: dto.supplierReference, idempotencyKey: dto.idempotencyKey,
          items: { create: dto.items.map((item) => ({ materialId: item.materialId, qtyActual: item.qtyActual, isQuarantine: true, qcStatus: QCStatus.QUARANTINE, lotNumber: item.lotNumber, expDate: item.expDate ? new Date(item.expDate) : undefined })) },
        }, include: { items: true } });
        return { ...inbound, idempotent: false };
      });
    } catch (error: any) {
      if (dto.idempotencyKey && String(error?.code) === 'P2002') {
        const existing = await this.prisma.warehouseInbound.findUniqueOrThrow({ where: { idempotencyKey: dto.idempotencyKey }, include: { items: true } });
        return { ...existing, idempotent: true };
      }
      throw error;
    }
  }

  /** Posting adds physical on-hand stock once, always into QUARANTINE. */
  async updateStatus(id: string, dto: UpdateInboundStatusDto) {
    if (dto.status !== InboundStatus.APPROVED) return this.prisma.warehouseInbound.update({ where: { id }, data: { status: dto.status } });
    const posted = await this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM warehouse_inbounds WHERE id = ${id} FOR UPDATE`;
      // Receipt rows protect duplicate posting of one GR.  The PO row is the
      // shared acceptance boundary across different GRs, so lock it before
      // calculating the remaining quantity.  Without this, two pending GRs
      // can both observe the same PO balance and over-receive concurrently.
      const lockedInbound = await tx.warehouseInbound.findUnique({ where: { id }, select: { poId: true } });
      if (!lockedInbound) throw new NotFoundException('Goods Receipt not found');
      if (lockedInbound.poId) await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id = ${lockedInbound.poId} FOR UPDATE`;
      const inbound = await tx.warehouseInbound.findUnique({ where: { id }, include: { items: true, po: { include: { items: true } } } });
      if (!inbound) throw new NotFoundException('Goods Receipt not found');
      if (inbound.reversedAt) throw new BadRequestException('A reversed Goods Receipt cannot be posted');
      if (inbound.status === InboundStatus.APPROVED) return { ...inbound, idempotent: true };
      if (inbound.status !== InboundStatus.PENDING || !inbound.po?.supplierId) throw new BadRequestException('Only a pending PO-backed Goods Receipt can be posted');
      for (const line of (inbound.items as Array<{ id: string; materialId: string; qtyActual: number; lotNumber?: string; expDate?: Date | null; inventoryId?: string | null }>)) {
        const poLine = inbound.po.items.find((item: { materialId: string }) => item.materialId === line.materialId);
        if (!poLine || Number(line.qtyActual) > Number(poLine.quantity) - Number(poLine.receivedQty)) throw new BadRequestException(`OVER_RECEIVE: ${line.materialId}`);
        const inventory = await tx.materialInventory.create({ data: { materialId: line.materialId, supplierId: inbound.po.supplierId, batchNumber: line.lotNumber || `${inbound.inboundNumber}-${line.id.slice(0, 8)}`, currentStock: line.qtyActual, reservedQty: 0, qcStatus: QCStatus.QUARANTINE, expDate: line.expDate, notes: `Goods Receipt ${inbound.inboundNumber}; initially quarantined` } });
        await tx.inboundItem.update({ where: { id: line.id }, data: { inventoryId: inventory.id } });
        await tx.inventoryTransaction.create({ data: { materialId: line.materialId, inventoryId: inventory.id, warehouseId: inbound.warehouseId, type: 'INBOUND', quantity: line.qtyActual, referenceNo: inbound.inboundNumber, commandKey: `goods-receipt:${inbound.id}:${line.id}`, performedBy: 'SCM_RECEIVING', notes: 'Posted Goods Receipt — physical stock held in QUARANTINE' } });
        await tx.materialItem.update({ where: { id: line.materialId }, data: { stockQty: { increment: line.qtyActual } } });
        await tx.purchaseOrderItem.update({ where: { id: poLine.id }, data: { receivedQty: { increment: line.qtyActual } } });
      }
      const allLines = await tx.purchaseOrderItem.findMany({ where: { poId: inbound.poId! } });
      await tx.purchaseOrder.update({ where: { id: inbound.poId! }, data: { status: allLines.every((line: { receivedQty: number | null; quantity: number | null }) => Number(line.receivedQty) >= Number(line.quantity)) ? POStatus.RECEIVED : POStatus.SHIPPED } });
      const result = await tx.warehouseInbound.update({ where: { id }, data: { status: InboundStatus.APPROVED }, include: { items: true } });
      return { ...result, idempotent: false };
    });
    if (!posted.idempotent) this.eventEmitter.emit('scm.goods_receipt.posted', { inboundId: id, inboundNumber: posted.inboundNumber });
    return posted;
  }

  /** QC changes only this receipt's linked lot; no cross-inbound material lookup. */
  async qcValidate(id: string, dto: { items: { inboundItemId: string; qcStatus: string }[] }) {
    return this.prisma.$transaction(async (tx: any) => {
      const inbound = await tx.warehouseInbound.findUnique({ where: { id }, include: { items: true } });
      if (!inbound || inbound.status !== InboundStatus.APPROVED) throw new BadRequestException('Post Goods Receipt before QC disposition');
      for (const requested of dto.items) {
        const item = inbound.items.find((line) => line.id === requested.inboundItemId);
        if (!item?.inventoryId || !Object.values(QCStatus).includes(requested.qcStatus as QCStatus)) throw new BadRequestException('Invalid receipt QC disposition');
        const status = requested.qcStatus as QCStatus;
        await tx.inboundItem.update({ where: { id: item.id }, data: { qcStatus: status, isQuarantine: status === QCStatus.QUARANTINE } });
        await tx.materialInventory.update({ where: { id: item.inventoryId }, data: { qcStatus: status } });
      }
      return { success: true };
    });
  }

  /** Never rewrites a posted receipt: creates compensating OUTBOUND ledger rows. */
  async reverse(id: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Reversal reason is required');
    return this.prisma.$transaction(async (tx: any) => {
      const inbound = await tx.warehouseInbound.findUnique({ where: { id }, include: { items: true, po: { include: { items: true } } } });
      if (!inbound) throw new NotFoundException('Goods Receipt not found');
      if (inbound.reversedAt) return inbound;
      if (inbound.status !== InboundStatus.APPROVED) throw new BadRequestException('Only posted Goods Receipts can be reversed');
      for (const line of (inbound.items as Array<{ id: string; materialId: string; qtyActual: number; lotNumber?: string; expDate?: Date | null; inventoryId?: string | null }>)) {
        if (!line.inventoryId) throw new BadRequestException('Posted receipt has no inventory link');
        const inventory = await tx.materialInventory.findUniqueOrThrow({ where: { id: line.inventoryId } });
        if (Number(inventory.reservedQty) > 0 || Number(inventory.currentStock) < Number(line.qtyActual)) throw new BadRequestException('REVERSAL_BLOCKED_AFTER_DOWNSTREAM_USE');
        await tx.materialInventory.update({ where: { id: inventory.id }, data: { currentStock: { decrement: line.qtyActual } } });
        await tx.materialItem.update({ where: { id: line.materialId }, data: { stockQty: { decrement: line.qtyActual } } });
        await tx.inventoryTransaction.create({ data: { materialId: line.materialId, inventoryId: inventory.id, warehouseId: inbound.warehouseId, type: 'OUTBOUND', quantity: line.qtyActual, referenceNo: inbound.inboundNumber, commandKey: `goods-receipt-reversal:${inbound.id}:${line.id}`, performedBy: 'SCM_RECEIVING', notes: `Reversal: ${reason}` } });
        const poLine = inbound.po?.items.find((item) => item.materialId === line.materialId);
        if (poLine) await tx.purchaseOrderItem.update({ where: { id: poLine.id }, data: { receivedQty: { decrement: line.qtyActual } } });
      }
      if (inbound.poId) await tx.purchaseOrder.update({ where: { id: inbound.poId }, data: { status: POStatus.SHIPPED } });
      return tx.warehouseInbound.update({ where: { id }, data: { reversedAt: new Date(), reversalReason: reason } });
    });
  }

  async findAll() { return this.prisma.warehouseInbound.findMany({ include: { po: { include: { supplier: true } }, items: { include: { material: { select: { name: true, unit: true } } } } }, orderBy: { receivedAt: 'desc' } }); }
  async reject(id: string, dto: { reason: string }) { if (!dto.reason?.trim()) throw new BadRequestException('Cancellation reason is required'); return this.prisma.warehouseInbound.update({ where: { id }, data: { status: InboundStatus.CANCELLED } }); }
}
