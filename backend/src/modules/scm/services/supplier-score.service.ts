import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class SupplierScoreService {
  constructor(private prisma: PrismaService) {}

  async recalculateAll() {
    const suppliers = await this.prisma.supplier.findMany({
      select: { id: true },
    });
    await Promise.all(
      suppliers.map(async (s) => {
        const score = await this.calculateScore(s.id);
        return this.prisma.supplier.update({
          where: { id: s.id },
          data: { performanceScore: score },
        });
      }),
    );
  }

  async calculateScore(supplierId: string): Promise<number> {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { supplierId },
      include: {
        inbounds: true,
        items: { include: { material: { select: { unitPrice: true } } } },
      },
    });

    if (pos.length === 0) return 0;

    // OTD Rate (40% weight) — on-time deliveries / total POs with inbounds
    const delivered = pos.filter((p) => p.inbounds.length > 0);
    const onTime = delivered.filter((p) =>
      p.estArrival && p.inbounds[0]?.receivedAt
        ? p.inbounds[0].receivedAt <= p.estArrival
        : false,
    );
    const otdRate =
      delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 0;

    // Quality Rate (35% weight) — completed POs / total POs
    const completed = pos.filter((p) => p.status === 'RECEIVED').length;
    const qualityRate = pos.length > 0 ? (completed / pos.length) * 100 : 0;

    // Cost Variance (25% weight) — compare PO unitPrice vs material.unitPrice
    let costScore = 100;
    const comparisons: number[] = [];
    for (const po of pos) {
      for (const item of po.items) {
        if (item.material?.unitPrice && Number(item.material.unitPrice) > 0) {
          const variance =
            Math.abs(Number(item.unitPrice) - Number(item.material.unitPrice)) /
            Number(item.material.unitPrice);
          comparisons.push(Math.max(0, (1 - variance) * 100));
        }
      }
    }
    if (comparisons.length > 0) {
      costScore = comparisons.reduce((a, b) => a + b, 0) / comparisons.length;
    }

    return Math.round(otdRate * 0.4 + qualityRate * 0.35 + costScore * 0.25);
  }
}
