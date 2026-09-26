import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { logBestEffort } from '../../../common/helpers/best-effort';
import {
  CreatePurchaseReturnDto,
  UpdatePurchaseReturnStatusDto,
} from '../dto/purchase-return.dto';
import { PurchaseReturnStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PurchaseReturnsService {
  private readonly logger = new Logger(PurchaseReturnsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseReturnDto, userId?: string) {
    const { items, reason, ...returnData } = dto;
    const notes = dto.notes || reason || '';

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Stock Availability for each item
      for (const item of items) {
        const material = await tx.materialItem.findUnique({
          where: { id: item.materialId },
          select: { stockQty: true, name: true },
        });

        if (!material) {
          throw new NotFoundException(`Material ${item.materialId} not found`);
        }

        if (Number(material.stockQty) < Number(item.quantity)) {
          throw new BadRequestException(
            `Insufficient stock for ${material.name}. Available: ${material.stockQty}, Requested: ${item.quantity}`,
          );
        }
      }

      // 2. Ensure Warehouse ID
      let warehouseId = returnData.warehouseId;
      if (!warehouseId) {
        const defaultWh = await tx.warehouse.findFirst();
        if (defaultWh) {
          warehouseId = defaultWh.id;
        } else {
          const newWh = await tx.warehouse.create({
            data: {
              name: 'Gudang Utama',
            },
          });
          warehouseId = newWh.id;
        }
      }

      // 3. Calculate Total Value
      const totalValue = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0,
      );

      // 4. Create Purchase Return
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          ...returnData,
          warehouseId,
          notes,
          returnNumber: await this.generateReturnNumber(tx),
          totalValue,
          status: PurchaseReturnStatus.WAITING_APPROVAL,
          ...(userId && { createdById: userId }),
          items: {
            create: items.map((i) => ({
              materialId: i.materialId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: Number(i.quantity) * Number(i.unitPrice),
            })),
          },
        },
        include: { items: true },
      });

      return purchaseReturn;
    });
  }

  private async generateReturnNumber(tx: any): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PRT-${year}${month}-`;

    const lastReturn = await tx.purchaseReturn.findFirst({
      where: { returnNumber: { startsWith: prefix } },
      orderBy: { returnNumber: 'desc' },
    });

    if (!lastReturn) return `${prefix}001`;

    const lastNum = parseInt(lastReturn.returnNumber.split('-')[2]);
    const nextNum = (lastNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  }

  async updateStatus(id: string, dto: UpdatePurchaseReturnStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchaseReturn.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!purchaseReturn)
        throw new NotFoundException('Purchase Return not found');

      // Logic: When status moves to COMPLETED, reduce stock and issue Debit Note
      if (
        dto.status === PurchaseReturnStatus.COMPLETED &&
        purchaseReturn.status !== PurchaseReturnStatus.COMPLETED
      ) {
        for (const item of purchaseReturn.items) {
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: {
              stockQty: { decrement: Number(item.quantity) },
            },
          });
        }

        const debitNoteNumber = `DN-${purchaseReturn.returnNumber.replace(/^(PRT|RET-PUR)-/, '')}`;
        const debitNoteAmount = purchaseReturn.totalValue;

        const updated = await tx.purchaseReturn.update({
          where: { id },
          data: {
            status: dto.status,
            debitNoteNumber,
            debitNoteAmount,
          },
          include: { items: { include: { material: true } }, supplier: true },
        });

        try {
          await tx.auditLog.create({
            data: {
              entityType: 'PurchaseReturn',
              entityId: id,
              action: 'APPROVE',
              source: 'SCM_PROCUREMENT',
              correlationId: id,
              actorPermissionSnapshot: { debitNoteNumber, debitNoteAmount },
              actorUserId: purchaseReturn.createdById || null,
              txId: randomUUID(),
            },
          });
        } catch (err) {
          logBestEffort(this.logger, 'audit:PurchaseReturn:APPROVE', err);
        }

        return updated;
      }

      return tx.purchaseReturn.update({
        where: { id },
        data: { status: dto.status },
        include: { items: true },
      });
    });
  }

  async findAll() {
    return this.prisma.purchaseReturn.findMany({
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { material: true } },
        creator: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ret = await this.prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { material: true } },
      },
    });
    if (!ret) throw new NotFoundException(`Return ${id} not found`);
    return ret;
  }
}
