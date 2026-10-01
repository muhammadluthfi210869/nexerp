import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

export interface MaterialReadinessDetail {
  materialId: string;
  materialName: string;
  totalRequired: number;
  actualStock: number;
  shortage: number;
  status: 'READY' | 'SHORTAGE';
}

export interface MaterialReadinessResult {
  status: 'READY' | 'SHORTAGE' | 'NO_APPROVED_SAMPLE';
  readinessDetails?: MaterialReadinessDetail[];
  details?: MaterialReadinessDetail[];
}

@Injectable()
export class ScmReadinessService {
  private readonly logger = new Logger(ScmReadinessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkMaterialReadiness(
    workOrderId: string,
  ): Promise<MaterialReadinessResult> {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        lead: {
          include: {
            sampleRequests: {
              where: { stage: 'APPROVED' },
              include: {
                billOfMaterials: {
                  include: {
                    material: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with ID ${workOrderId} not found`);
    }

    const sampleRequest = workOrder.lead.sampleRequests[0];
    if (!sampleRequest) {
      return { status: 'NO_APPROVED_SAMPLE', details: [] };
    }

    const readinessDetails: MaterialReadinessDetail[] = await Promise.all(
      sampleRequest.billOfMaterials.map(async (bom: any) => {
        const totalRequired =
          Number(workOrder.targetQty) * Number(bom.quantityPerUnit);

        const inventories = await this.prisma.materialInventory.findMany({
          where: { materialId: bom.materialId },
        });

        const actualStock = inventories.reduce(
          (sum: number, inv: any) => sum + Number(inv.currentStock),
          0,
        );

        const shortage = actualStock - totalRequired;

        return {
          materialId: bom.materialId,
          materialName: bom.material?.name || 'Unknown',
          totalRequired,
          actualStock,
          shortage: shortage < 0 ? Math.abs(shortage) : 0,
          status: shortage < 0 ? ('SHORTAGE' as const) : ('READY' as const),
        };
      }),
    );

    const hasShortage = readinessDetails.some((d) => d.status === 'SHORTAGE');

    return {
      status: hasShortage ? 'SHORTAGE' : 'READY',
      readinessDetails,
    };
  }

  async getActiveWorkOrders() {
    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        stage: { not: 'FINISHED_GOODS' },
      },
      include: {
        lead: true,
      },
    });

    const woIds = workOrders.map((wo) => wo.id);
    const [releaseLogs, ...readinessResults] = await Promise.all([
      this.prisma.productionLog.findMany({
        where: {
          workOrderId: { in: woIds },
          notes: 'SYSTEM: MATERIAL_RELEASED_BY_WAREHOUSE',
        },
      }),
      ...workOrders.map((wo) => this.checkMaterialReadiness(wo.id)),
    ]);
    const releasedWoIds = new Set(releaseLogs.map((l) => l.workOrderId));

    return workOrders.map((wo, i) => ({
      ...wo,
      materialReadiness: readinessResults[i].status,
      readinessDetails: readinessResults[i].readinessDetails,
      isReleased: releasedWoIds.has(wo.id),
    }));
  }
}
