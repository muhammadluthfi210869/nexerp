import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LifecycleStatus } from '@prisma/client';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  async deliver(
    workOrderId: string,
    courierName: string,
    trackingNumber: string,
  ) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        invoices: true,
        lead: true,
      },
    });

    if (!wo) throw new NotFoundException('Work Order not found');

    // 1. Check if Final Invoice exists
    if (!wo.invoices || wo.invoices.length === 0) {
      throw new BadRequestException(
        'Final Invoice belum diterbitkan. Tidak dapat memproses pengiriman.',
      );
    }

    const latestInvoice = wo.invoices[0];
    const paymentType = wo.lead.paymentType;
    const now = new Date();

    // 2. LOGIKA VALIDASI CREDIT POLICY
    if (paymentType === 'PREPAID') {
      if (latestInvoice.status !== 'PAID') {
        throw new BadRequestException(
          'Kebijakan PREPAID: Tagihan belum lunas. Pengiriman ditolak.',
        );
      }
    } else if (paymentType === 'CREDIT' || paymentType === 'PARTIAL') {
      if (
        latestInvoice.status === 'UNPAID' &&
        latestInvoice.dueDate &&
        latestInvoice.dueDate < now
      ) {
        throw new BadRequestException(
          'Kebijakan KREDIT: Klien memiliki tagihan jatuh tempo. Pengiriman ditahan.',
        );
      }
    }

    if (wo.stage !== LifecycleStatus.FINISHED_GOODS) {
      throw new BadRequestException(
        'Work Order must be in FINISHED_GOODS stage to be shipped',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Delivery Order
      const delivery = await tx.deliveryOrder.create({
        data: {
          workOrderId,
          courierName,
          trackingNumber,
          status: 'SHIPPED',
        },
      });

      // 2. Update Work Order stage
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { stage: LifecycleStatus.DELIVERED },
      });

      return delivery;
    });
  }

  async getDeliverableOrders() {
    return this.prisma.workOrder.findMany({
      where: { stage: LifecycleStatus.FINISHED_GOODS },
      include: {
        lead: true,
      },
    });
  }
}
