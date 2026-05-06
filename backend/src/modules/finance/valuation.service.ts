import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class ValuationService {
  constructor(private prisma: PrismaService) {}

  @OnEvent('scm.inbound_approved')
  async handleInboundApproved(payload: {
    inboundId: string;
    poId: string;
    items: { materialId: string; qty: number }[];
  }) {
    console.log(
      `[VALUATION_ENGINE] Processing MAP for inbound: ${payload.inboundId}`,
    );

    for (const item of payload.items) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Get current material data
          const material = await tx.materialItem.findUnique({
            where: { id: item.materialId },
            include: {
              valuations: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          });

          if (!material) return;

          // 2. Get purchase price from PO
          let purchasePrice = Number(material.unitPrice); // fallback
          if (payload.poId) {
            const poItem = await tx.purchaseOrderItem.findFirst({
              where: { poId: payload.poId, materialId: item.materialId },
            });
            if (poItem) purchasePrice = Number(poItem.unitPrice);
          }

          const qtyBaru = Number(item.qty);
          const totalQty = Number(material.stockQty);
          const qtyLama = totalQty - qtyBaru;

          // Use previous MAP or existing unitPrice as base
          const mapLama = material.valuations[0]
            ? Number(material.valuations[0].movingAveragePrice)
            : Number(material.unitPrice);

          // 3. Formula: ((Qty_Lama * MAP_Lama) + (Qty_Baru * Harga_Beli)) / Qty_Total
          let newMap = purchasePrice;

          if (totalQty > 0) {
            const totalValueLama = (qtyLama > 0 ? qtyLama : 0) * mapLama;
            const totalValueBaru = qtyBaru * purchasePrice;
            newMap = (totalValueLama + totalValueBaru) / totalQty;
          }

          // 4. Record new valuation history
          await tx.materialValuation.create({
            data: {
              materialId: item.materialId,
              movingAveragePrice: newMap,
              lastPurchasePrice: purchasePrice,
              totalQty: totalQty,
              totalValue: totalQty * newMap,
              referenceNo: payload.inboundId,
            },
          });

          // 5. Sync back to material unitPrice for system-wide reference (HPP Auto)
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: { unitPrice: newMap },
          });

          console.log(
            `[VALUATION_ENGINE] Updated MAP for ${material.name}: ${newMap.toLocaleString('id-ID')} (Prev: ${mapLama.toLocaleString('id-ID')})`,
          );
        });
      } catch (err) {
        console.error(
          `[VALUATION_ENGINE] Failed to update MAP for item ${item.materialId}`,
          err,
        );
      }
    }
  }
}
