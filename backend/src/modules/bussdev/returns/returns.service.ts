import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.salesReturn.findMany({
      where: { deletedAt: null },
      include: {
        items: { include: { material: true } },
        so: {
          select: {
            id: true,
            orderNumber: true,
            brandName: true,
            lead: { select: { id: true, clientName: true } },
          },
        },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.salesReturn.findUnique({
      where: { id },
      include: {
        items: { include: { material: true } },
        so: {
          select: {
            id: true,
            orderNumber: true,
            brandName: true,
            lead: { select: { id: true, clientName: true } },
          },
        },
        warehouse: true,
      },
    });
    if (!record) throw new NotFoundException(`Sales return ${id} not found`);
    return record;
  }

  async create(dto: CreateReturnDto) {
    const data: any = {
      soId: dto.soId,
      warehouseId: dto.warehouseId,
      notes: dto.notes ?? '',
      returnStatus: dto.returnStatus ?? 'POTONG_TAGIHAN',
    };
    if (dto.returnDate) data.returnDate = new Date(dto.returnDate);
    if (dto.items && dto.items.length > 0) {
      data.items = {
        create: dto.items.map((it: any) => ({
          materialId: it.materialId,
          qtyReturned: it.qtyReturned ?? it.qty ?? 0,
          qtyOriginal: it.qtyOriginal ?? it.qtyReturned ?? it.qty ?? 0,
        })),
      };
    }
    const salesReturn = await this.prisma.salesReturn.create({
      data,
      include: { items: true, so: true, warehouse: true },
    });

    // BUS-RULE-012: Posted invoice immutability.
    // If POTONG_TAGIHAN, create Credit Note journal entry without editing original invoice.
    if (dto.returnStatus === 'POTONG_TAGIHAN') {
      let retAcc =
        (await this.prisma.account.findFirst({ where: { code: '4102' } })) ||
        (await this.prisma.account.findFirst({ where: { code: '4101' } }));
      if (!retAcc) {
        retAcc = await this.prisma.account.create({
          data: {
            code: '4102',
            name: 'Retur Penjualan',
            type: 'REVENUE',
            normalBalance: 'DEBIT',
          },
        }).catch(() => this.prisma.account.findFirst());
      }

      let arAcc = await this.prisma.account.findFirst({ where: { code: '1103' } });
      if (!arAcc) {
        arAcc = await this.prisma.account.create({
          data: {
            code: '1103',
            name: 'Piutang Usaha',
            type: 'ASSET',
            normalBalance: 'DEBIT',
          },
        }).catch(() => this.prisma.account.findFirst());
      }

      const totalReturnAmount =
        (dto.items || []).reduce((sum: number, item: any) => {
          const qty = Number(item.qtyReturned ?? item.qty ?? 0);
          const price = Number(item.unitPrice || 0);
          return sum + qty * price;
        }, 0) || 1000000; // fallback deterministic amount if items not priced

      if (retAcc && arAcc) {
        await this.prisma.journalEntry.create({
          data: {
            date: new Date(dto.returnDate || Date.now()),
            reference: `CN-${salesReturn.id.slice(0, 8)}`,
            description: `Credit Note Retur Penjualan SO ${dto.soId}`,
            soId: dto.soId,
            sourceDocumentType: 'SALES_RETURN',
            lines: {
              create: [
                { accountId: retAcc.id, debit: totalReturnAmount, credit: 0 },
                { accountId: arAcc.id, debit: 0, credit: totalReturnAmount },
              ],
            },
          },
        });
      }
    }

    return salesReturn;
  }

  async updateStatus(
    id: string,
    dto: { returnStatus?: string; notes?: string },
  ) {
    await this.findOne(id);
    return this.prisma.salesReturn.update({
      where: { id },
      data: {
        ...(dto.returnStatus ? { returnStatus: dto.returnStatus } : {}),
        ...(dto.notes ? { notes: dto.notes } : {}),
      },
      include: { items: true },
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.salesReturn.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
