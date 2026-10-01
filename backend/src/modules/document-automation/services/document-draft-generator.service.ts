import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import {
  DocumentType,
  DocumentDraftStatus,
  SourceDocumentType,
} from '@prisma/client';

@Injectable()
export class DocumentDraftGeneratorService {
  private readonly logger = new Logger(DocumentDraftGeneratorService.name);

  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  @OnEvent('production.batch_record.created')
  async handleBatchRecordCreated(payload: {
    workOrderId?: string;
    id?: string;
  }) {
    const woId = payload.workOrderId || payload.id;
    if (!woId) return;
    this.logger.log(`[DOC_AUTO] WorkOrder/Batch created: generating BMR draft for ${woId}`);

    try {
      const wo = await this.prisma.workOrder.findUnique({
        where: { id: woId },
        include: { lead: true },
      });
      if (!wo) return;

      const draftNumber = await this.idGenerator.generateId('BR');
      await this.prisma.documentDraft.create({
        data: {
          draftNumber,
          documentType: DocumentType.BATCH_RECORD,
          sourceType: SourceDocumentType.WORK_ORDER,
          sourceId: wo.id,
          status: DocumentDraftStatus.DRAFT,
          payload: {
            batchRecordCode: wo.woNumber,
            date: new Date().toISOString().split('T')[0],
            status: wo.stage,
            salesOrderCode: wo.woNumber,
            salesDate: new Date().toISOString().split('T')[0],
            customerName: wo.lead?.clientName || wo.lead?.brandName || '-',
            category: 'Produk Baru',
            createdBy: 'Staff Produksi',
            createdAtFormatted: new Date().toLocaleDateString('id-ID'),
            products: [
              {
                itemCode: wo.woNumber,
                productName: wo.lead?.productInterest || 'Produk Maklon',
                formulaCode: wo.woNumber,
                unit: 'pcs',
              },
            ],
            statusHistory: [
              {
                description: `Batch dibuat dengan target ${wo.targetQty} pcs`,
                by: 'Sistem Produksi',
                date: new Date().toLocaleDateString('id-ID'),
              },
            ],
          },
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to generate Batch Record draft: ${e.message}`);
    }
  }

  @OnEvent('production.schedule.created')
  async handleScheduleCreated(payload: {
    scheduleId?: string;
    id?: string;
    stage?: string;
  }) {
    const schedId = payload.scheduleId || payload.id;
    if (!schedId) return;

    try {
      const sched = await this.prisma.productionSchedule.findUnique({
        where: { id: schedId },
        include: {
          machine: true,
          workOrder: { include: { lead: true } },
        },
      });
      if (!sched) return;

      const isMixing = (sched.stage || payload.stage || '').toUpperCase().includes('MIX');
      const docType = isMixing
        ? DocumentType.SCHEDULE_MIXING
        : DocumentType.SCHEDULE_PACKAGING;
      const prefix = isMixing ? 'SM' : 'SP';
      const draftNumber = await this.idGenerator.generateId(prefix);
      const targetQty = sched.targetQty || sched.workOrder?.targetQty || 100;

      await this.prisma.documentDraft.create({
        data: {
          draftNumber,
          documentType: docType,
          sourceType: SourceDocumentType.PRODUCTION_PLAN,
          sourceId: sched.id,
          status: DocumentDraftStatus.DRAFT,
          payload: {
            date: sched.startTime ? sched.startTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: sched.status || 'Pending',
            batchRecordCode: sched.workOrder?.woNumber || '-',
            soCode: sched.workOrder?.woNumber || '-',
            customerName: sched.workOrder?.lead?.clientName || '-',
            category: 'Produk Baru',
            productName: sched.workOrder?.lead?.productInterest || 'Produk Kosmetik',
            targetQty,
            nettoPerPcs: 50,
            unit: 'ml',
            upscalePct: Number(sched.upscalePercent || 5),
            hasilUpscale: Number(sched.upscaleResult || 0),
            createdBy: sched.machine?.name || 'Staff Produksi',
            createdAt: sched.startTime?.toLocaleDateString('id-ID') || '-',
            secondaryPackaging: [
              {
                code: 'KSR001',
                name: 'STICKER KEMASAN',
                qty: targetQty,
                unit: 'pcs',
                notes: 'Sesuai Approved Artwork',
              },
            ],
          },
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to generate Schedule draft: ${e.message}`);
    }
  }

  @OnEvent('sales_down_payment.recorded')
  async handleDownPaymentRecorded(payload: {
    paymentId?: string;
    id?: string;
  }) {
    const payId = payload.paymentId || payload.id;
    if (!payId) return;

    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: payId },
        include: {
          invoice: {
            include: {
              so: { include: { lead: true } },
            },
          },
        },
      });
      if (!payment) return;

      const draftNumber = await this.idGenerator.generateId('KWT');
      await this.prisma.documentDraft.create({
        data: {
          draftNumber,
          documentType: DocumentType.KWITANSI,
          sourceType: SourceDocumentType.PAYMENT,
          sourceId: payment.id,
          status: DocumentDraftStatus.DRAFT,
          payload: {
            date: payment.paymentDate.toISOString().split('T')[0],
            clientName: payment.invoice?.so?.lead?.clientName || 'Pelanggan',
            brandName: payment.invoice?.so?.lead?.brandName || '-',
            address: [payment.invoice?.so?.lead?.district, payment.invoice?.so?.lead?.city, payment.invoice?.so?.lead?.province].filter(Boolean).join(', ') || '-',
            phone: payment.invoice?.so?.lead?.contactInfo || '-',
            amount: Number(payment.amountPaid),
            paidAmount: Number(payment.amountPaid),
            items: [
              {
                productName: `Penerimaan Pembayaran - Invoice ${payment.invoice?.invoiceNumber || '-'}`,
                qty: 1,
                harga: Number(payment.amountPaid),
                total: Number(payment.amountPaid),
              },
            ],
          },
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to generate Kwitansi draft: ${e.message}`);
    }
  }

  @OnEvent('warehouse.transfer.created')
  async handleGoodsTransferCreated(payload: {
    transferId?: string;
    id?: string;
  }) {
    const tId = payload.transferId || payload.id;
    if (!tId) return;

    try {
      const gt = await this.prisma.transferOrder.findUnique({
        where: { id: tId },
        include: {
          sourceWarehouse: true,
          destWarehouse: true,
          items: { include: { material: true } },
        },
      });
      if (!gt) return;

      const draftNumber = await this.idGenerator.generateId('GT');
      await this.prisma.documentDraft.create({
        data: {
          draftNumber,
          documentType: DocumentType.GOODS_TRANSFER,
          sourceType: SourceDocumentType.GOODS_TRANSFER,
          sourceId: gt.id,
          status: DocumentDraftStatus.DRAFT,
          payload: {
            transferDate: gt.date.toISOString().split('T')[0],
            fromWarehouse: gt.sourceWarehouse?.name || 'Gudang Asal',
            toWarehouse: gt.destWarehouse?.name || 'Gudang Tujuan',
            createdBy: 'Staff Logistik',
            notes: gt.notes || '-',
            items: gt.items.map((it: any) => ({
              itemCode: it.material?.code || '-',
              productName: it.material?.name || '-',
              unit: it.material?.unit || 'pcs',
              qty: Number(it.qty || 0),
              notes: '-',
            })),
          },
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to generate Goods Transfer draft: ${e.message}`);
    }
  }

  @OnEvent('warehouse.opname.created')
  async handleStockOpnameCreated(payload: { opnameId?: string; id?: string }) {
    const opId = payload.opnameId || payload.id;
    if (!opId) return;

    try {
      const op = await this.prisma.stockOpname.findUnique({
        where: { id: opId },
        include: {
          warehouse: true,
          items: { include: { material: true } },
        },
      });
      if (!op) return;

      const draftNumber = await this.idGenerator.generateId('STO');
      await this.prisma.documentDraft.create({
        data: {
          draftNumber,
          documentType: DocumentType.STOCK_OPNAME,
          sourceType: SourceDocumentType.STOCK_OPNAME,
          sourceId: op.id,
          status: DocumentDraftStatus.DRAFT,
          payload: {
            date: op.opnameDate.toISOString().split('T')[0],
            warehouseName: op.warehouse?.name || 'Gudang Bahan Baku',
            createdBy: 'Staff Gudang',
            notes: op.notes || '-',
            items: op.items.map((it: any) => ({
              itemCode: it.material?.code || '-',
              productName: it.material?.name || '-',
              unit: it.material?.unit || 'pcs',
              systemStock: Number(it.systemQty || 0),
              actualStock: Number(it.actualQty || 0),
              difference: Number(it.difference || 0),
              notes: it.notes || '-',
            })),
          },
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to generate Stock Opname draft: ${e.message}`);
    }
  }
}
