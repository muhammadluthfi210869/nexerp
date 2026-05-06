import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreatePurchaseReturnDto,
  UpdatePurchaseReturnStatusDto,
} from '../dto/purchase-return.dto';
import { PurchaseReturnStatus } from '@prisma/client';

@Injectable()
export class PurchaseReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseReturnDto) {
    const { items, ...returnData } = dto;

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

      // 2. Calculate Total Value
      const totalValue = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0,
      );

      // 3. Create Purchase Return
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          ...returnData,
          returnNumber: await this.generateReturnNumber(tx),
          totalValue,
          status: PurchaseReturnStatus.DRAFT,
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
    const prefix = `RET-PUR-${year}${month}-`;

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

      // Logic: When status moves to COMPLETED, reduce stock
      if (
        dto.status === PurchaseReturnStatus.COMPLETED &&
        purchaseReturn.status !== PurchaseReturnStatus.COMPLETED
      ) {
        for (const item of purchaseReturn.items) {
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: {
              stockQty: { decrement: item.quantity },
            },
          });

          // Record Inventory Transaction
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: 'OUTBOUND', // Or specific type if available
              quantity: item.quantity,
              referenceNo: purchaseReturn.returnNumber,
              notes: `PURCHASE_RETURN: ${purchaseReturn.notes || ''}`,
              warehouseId: purchaseReturn.warehouseId,
            },
          });
        }
      }

      return tx.purchaseReturn.update({
        where: { id },
        data: { status: dto.status },
      });
    });
  }

  async findAll() {
    return this.prisma.purchaseReturn.findMany({
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { material: true } },
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
